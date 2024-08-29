import { currentApp, currentInstance } from './shared/instance';
import { ComponentInternalInstance } from './shared/internal';
import { bindHooks, getListeners } from './shared/lifecycle';
import { IAnyFunction } from './shared/types';
import { handleError } from './vue/errorHandling';

export const onAppShow =
  createAppHook<(options: WechatMiniprogram.App.LaunchShowOption) => void>(
    'onAppShow',
  );

export const onAppHide = createAppHook<() => void>('onAppHide');

export const onAppError = createAppHook<(error: string) => void>('onAppError');

export const onPageNotFound =
  createAppHook<(options: WechatMiniprogram.App.PageNotFoundOption) => void>(
    'onPageNotFound',
  );

export const onUnhandledRejection =
  createAppHook<WechatMiniprogram.OnUnhandledRejectionCallback>(
    'onUnhandledRejection',
  );

export const onThemeChange =
  createAppHook<WechatMiniprogram.OnThemeChangeCallback>('onThemeChange');

export const onDetached = createComponentHook('onDetached');

export const onReady = createComponentHook('onReady');

export const onMoved = createComponentHook('onMoved');

export const onError = createComponentHook<(error: Error) => void>('onError');

export const onLoad =
  createComponentHook<(query: Record<string, string | undefined>) => void>(
    'onLoad',
  );

export const onShow = createComponentHook('onShow');

export const onHide = createComponentHook('onHide');

export const onUnload = createComponentHook('onUnload');

export const onRouteDone = createComponentHook('onRouteDone');

export const onPullDownRefresh = createComponentHook('onPullDownRefresh');

export const onReachBottom = createComponentHook('onReachBottom');

export const onPageScroll =
  createComponentHook<
    (options: WechatMiniprogram.Page.IPageScrollOption) => void
  >('onPageScroll');

export const onAddToFavorites = createComponentHook<
  (
    options: WechatMiniprogram.Page.IAddToFavoritesOption,
  ) => WechatMiniprogram.Page.IAddToFavoritesContent
>('onAddToFavorites', true);

export const onShareAppMessage = createComponentHook<
  (
    options: WechatMiniprogram.Page.IShareAppMessageOption,
  ) => WechatMiniprogram.Page.ICustomShareContent | void
>('onShareAppMessage', true);

export const onShareTimeline = createComponentHook<
  () => WechatMiniprogram.Page.ICustomTimelineContent
>('onShareTimeline', true);

export const onResize =
  createComponentHook<(size: WechatMiniprogram.Page.IResizeOption) => void>(
    'onResize',
  );

export const onTabItemTap =
  createComponentHook<
    (options: WechatMiniprogram.Page.ITabItemTapOption) => void
  >('onTabItemTap');

export interface ISaveExitStateContent {
  /** 需要保存的数据（只能是 JSON 兼容的数据） */
  data: unknown;
  /** 超时时刻，在这个时刻后，保存的数据保证一定被丢弃，默认为 (当前时刻 + 1 天) */
  expireTimeStamp?: number;
}

export const onSaveExitState =
  createComponentHook<() => ISaveExitStateContent | undefined>(
    'onSaveExitState',
  );

function createAppHook<T extends IAnyFunction>(lifecycle: string) {
  return (callback: T) => {
    if (currentApp) {
      bindHooks(currentApp, lifecycle, callback);
    } else if (__DEV__) {
      warnMissingContext(lifecycle);
    }
  };
}

function createComponentHook<T extends IAnyFunction = () => void>(
  lifecycle: string,
  ensureUnique?: boolean,
) {
  return (callback: T) => {
    if (!currentInstance) {
      if (__DEV__) {
        warnMissingContext(lifecycle, currentInstance);
      }
      return;
    }
    if (ensureUnique) {
      const listeners = getListeners(currentInstance.instance, lifecycle);
      if (listeners?.length) {
        handleError(
          new Error(`${lifecycle} is registered more than once`),
          currentInstance,
          lifecycle,
        );
      }
    }
    bindHooks(currentInstance.instance, lifecycle, callback);
  };
}

function warnMissingContext(
  hookName: string,
  instance?: ComponentInternalInstance,
) {
  handleError(
    new Error(
      `${hookName} is called when there is no active component instance to be ` +
        `associated with. ` +
        `Lifecycle injection APIs can only be used during execution of setup().`,
    ),
    instance,
    hookName,
  );
}
