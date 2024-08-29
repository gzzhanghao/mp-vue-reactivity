import { pauseTracking, resetTracking } from '@vue/reactivity';

import { setCurrentApp } from './shared/instance';
import { bindHooks, createTriggerFn } from './shared/lifecycle';
import { normalizeOptions } from './shared/options';
import { IAnyObject } from './shared/types';
import { keys } from './shared/utils';
import { callWithErrorHandling } from './vue/errorHandling';

export interface AppSetupContext<TExt extends IAnyObject> {
  app: WechatMiniprogram.App.Instance<TExt>;
  options: WechatMiniprogram.App.LaunchShowOption;
}

export type AppSetupFn<TExt extends IAnyObject> = (
  options: WechatMiniprogram.App.LaunchShowOption,
  context: AppSetupContext<TExt>,
) => IAnyObject | void;

export type AppOptions<TExt extends IAnyObject> =
  WechatMiniprogram.App.Options<TExt> & {
    setup?: AppSetupFn<TExt>;
  };

export function createApp<TExt extends IAnyObject>(
  setup: AppSetupFn<TExt>,
): void;

export function createApp<TExt extends IAnyObject>(
  options: AppOptions<TExt>,
): void;

export function createApp(optionsOrSetup: any): void {
  const { setup, options } = normalizeOptions<
    AppSetupFn<IAnyObject>,
    AppOptions<{ setup?: AppSetupFn<IAnyObject> }>
  >(optionsOrSetup);

  if (!setup) {
    App(options);
    return;
  }

  App<IAnyObject>({
    ...options,
    setup: undefined,
    onLaunch(launchOptions) {
      bindHooks(this, 'onAppShow', options.onShow);
      bindHooks(this, 'onAppHide', options.onHide);
      bindHooks(this, 'onAppError', options.onError);
      bindHooks(this, 'onPageNotFound', options.onPageNotFound);
      bindHooks(this, 'onUnhandledRejection', options.onUnhandledRejection);
      bindHooks(this, 'onThemeChange', options.onThemeChange);

      setCurrentApp(this);
      pauseTracking();

      const setupResult = callWithErrorHandling(setup, undefined, 'app setup', [
        launchOptions,
        { app: this },
      ]);

      resetTracking();
      setCurrentApp(undefined);

      for (const key of keys(setupResult)) {
        this[key] = setupResult[key];
      }

      if (options.onLaunch) {
        options.onLaunch.call(this, launchOptions);
      }
    },
    onShow: createTriggerFn('onAppShow'),
    onHide: createTriggerFn('onAppHide'),
    onError: createTriggerFn('onAppError'),
    onPageNotFound: createTriggerFn('onPageNotFound'),
    onUnhandledRejection: createTriggerFn('onUnhandledRejection'),
    onThemeChange: createTriggerFn('onThemeChange'),
  });
}
