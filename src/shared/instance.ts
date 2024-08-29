import { ComponentInternalInstance } from './internal';
import { IAnyObject } from './types';

export let currentApp: WechatMiniprogram.App.Instance<IAnyObject> | undefined;

export function setCurrentApp(
  app: WechatMiniprogram.App.Instance<IAnyObject> | undefined,
) {
  currentApp = app;
}

export let currentInstance: ComponentInternalInstance | undefined;

export function setCurrentInstance(
  instance: ComponentInternalInstance | undefined,
) {
  currentInstance = instance;
}
