import {
  isReactive,
  isRef,
  shallowReactive,
  shallowReadonly,
} from '@vue/reactivity';

import { watch } from './apiWatch';
import { setCurrentInstance } from './shared/instance';
import {
  GenericComponentInstance,
  createInternal,
  getInternal,
} from './shared/internal';
import {
  bindHooks,
  createTriggerFn,
  triggerLifecycle,
} from './shared/lifecycle';
import { normalizeOptions } from './shared/options';
import { IAnyObject } from './shared/types';
import { unrefDeep } from './shared/unref';
import { isFunction, isObject, keys } from './shared/utils';
import { callWithErrorHandling } from './vue/errorHandling';
import { flushJobs } from './vue/scheduler';

export interface ComponentSetupContext<TCom extends GenericComponentInstance> {
  component: TCom;
  /** 触发事件，参见组件事件 */
  triggerEvent: TCom['triggerEvent'];
}

export type ComponentSetupFn<TProps, TCom extends GenericComponentInstance> = (
  props: TProps,
  context: ComponentSetupContext<TCom>,
) => IAnyObject | void;

export interface CommonComponentOptions {
  listenPageScroll?: boolean;
  canShareAppMessage?: boolean;
  canShareTimeline?: boolean;
}

export type ComponentOptionsWithoutProps<
  TData extends WechatMiniprogram.Component.DataOption,
  TMethod extends WechatMiniprogram.Component.MethodOption,
> = WechatMiniprogram.Component.Options<
  TData,
  WechatMiniprogram.Component.PropertyOption,
  TMethod
> &
  CommonComponentOptions & {
    properties?: undefined;
    setup?: ComponentSetupFn<
      Record<string, never>,
      WechatMiniprogram.Component.Instance<
        TData,
        WechatMiniprogram.Component.PropertyOption,
        TMethod
      >
    >;
  };

export type ComponentOptionsWithProps<
  TProps extends WechatMiniprogram.Component.PropertyOption,
  TData extends WechatMiniprogram.Component.DataOption,
  TMethods extends WechatMiniprogram.Component.MethodOption,
> = WechatMiniprogram.Component.Options<TData, TProps, TMethods> &
  CommonComponentOptions & {
    setup?: ComponentSetupFn<
      WechatMiniprogram.Component.PropertyOptionToData<TProps>,
      WechatMiniprogram.Component.Instance<TData, TProps, TMethods>
    >;
  };

const commonPageEvents = [
  'onLoad',
  'onShow',
  'onHide',
  'onUnload',
  'onRouteDone',
  'onPullDownRefresh',
  'onReachBottom',
  'onResize',
  'onTabItemTap',
];

const fullPageEvents = [
  ...commonPageEvents,
  'onAddToFavorites',
  'onPageScroll',
  'onSaveExitState',
  'onShareAppMessage',
  'onShareTimeline',
];

export function defineComponent<TProps>(
  setup: ComponentSetupFn<TProps, GenericComponentInstance>,
): string;

export function defineComponent<
  TData extends WechatMiniprogram.Component.DataOption,
  TMethods extends WechatMiniprogram.Component.MethodOption,
>(options: ComponentOptionsWithoutProps<TData, TMethods>): string;

export function defineComponent<
  Props extends WechatMiniprogram.Component.PropertyOption,
  Data extends WechatMiniprogram.Component.DataOption,
  Methods extends WechatMiniprogram.Component.MethodOption,
>(options: ComponentOptionsWithProps<Props, Data, Methods>): string;

export function defineComponent(optionsOrSetup: any): string {
  const { setup, options } = normalizeOptions<
    ComponentSetupFn<Record<string, unknown>, any>,
    ComponentOptionsWithProps<any, any, any>
  >(optionsOrSetup);

  if (!setup) {
    return Component(options);
  }

  const proxiedMethods: Record<string, any> = { ...options.methods };
  for (const key of commonPageEvents) {
    proxiedMethods[key] = createTriggerFn(key);
  }
  if (options.canShareAppMessage || proxiedMethods.onShareAppMessage) {
    proxiedMethods.onShareAppMessage = createTriggerFn('onShareAppMessage');
  }
  if (options.canShareTimeline || proxiedMethods.onShareTimeline) {
    proxiedMethods.onShareTimeline = createTriggerFn('onShareTimeline');
  }

  if (options.listenPageScroll || proxiedMethods.onPageScroll) {
    proxiedMethods.onPageScroll = createTriggerFn('onPageScroll');
  }

  const propertyKeys = options.properties
    ? Object.keys(options.properties)
    : undefined;

  let proxiedObservers = options.observers;
  if (propertyKeys?.length) {
    proxiedObservers = { ...proxiedObservers };
    for (const key of propertyKeys) {
      const originObserver = proxiedObservers[key];
      proxiedObservers[key] = function (newValue: unknown) {
        const internal = getInternal(this);
        if (internal) {
          internal.props[key] = newValue;
        }
        if (originObserver) {
          originObserver.call(this, newValue);
        }
      };
    }
  }

  return Component({
    ...options,
    observers: proxiedObservers,
    lifetimes: {
      attached() {
        bindHooks(this, 'onDetached', options.lifetimes?.detached);
        bindHooks(this, 'onReady', options.lifetimes?.ready);
        bindHooks(this, 'onMoved', options.lifetimes?.moved);
        bindHooks(this, 'onError', options.lifetimes?.error);

        bindHooks(this, 'onShow', options.pageLifetimes?.show);
        bindHooks(this, 'onHide', options.pageLifetimes?.hide);
        bindHooks(this, 'onResize', options.pageLifetimes?.resize);
        bindHooks(this, 'onRouteDone', options.pageLifetimes?.routeDone);

        for (const lifecycle of fullPageEvents) {
          bindHooks(this, lifecycle, options.methods?.[lifecycle]);
        }

        const rawProps: Record<string, unknown> = {};
        if (propertyKeys) {
          for (const key of propertyKeys) {
            rawProps[key] = this.data[key];
          }
        }

        const internal = createInternal(this, shallowReactive(rawProps));

        if (__DEV__) {
          this.__internal__ = internal;
        }

        internal.scope.run(() => {
          setCurrentInstance(internal);

          const result = callWithErrorHandling(setup, internal, 'setup', [
            shallowReadonly(internal.props),
            createSetupContext(this),
          ]);

          for (const key of keys(result)) {
            const value = result[key];
            if (isFunction(value)) {
              this[key] = value;
              continue;
            }
            if (!isObject(value)) {
              this.setData({ [key]: value });
              continue;
            }
            watch(
              isRef(value) || isReactive(value) ? value : () => value,
              (value) => {
                this.setData({ [key]: unrefDeep(value) });
              },
              {
                deep: true,
                immediate: true,
              },
            );
          }

          setCurrentInstance(undefined);
        });

        if (options.lifetimes?.attached) {
          options.lifetimes.attached.call(this);
        }

        flushJobs();
      },
      detached() {
        const internal = getInternal(this);
        if (internal) {
          internal.scope.stop();
        }
        triggerLifecycle(this, 'onDetached');
      },
      ready: createTriggerFn('onReady'),
      moved: createTriggerFn('onMoved'),
      error: createTriggerFn('onError'),
    },
    pageLifetimes: {
      show: createTriggerFn('onShow'),
      hide: createTriggerFn('onHide'),
      resize: createTriggerFn('onResize'),
      routeDone: createTriggerFn('onRouteDone'),
    },
    methods: proxiedMethods,
  });
}

function createSetupContext<TCom extends GenericComponentInstance>(
  component: TCom,
): ComponentSetupContext<TCom> {
  return {
    component,
    triggerEvent: (name, detail, options) =>
      component.triggerEvent(name, detail, options),
  };
}
