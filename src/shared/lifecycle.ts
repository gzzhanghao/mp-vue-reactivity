import { IAnyFunction } from './types';

const lifecycleListeners = new WeakMap<object, Map<string, IAnyFunction[]>>();

export function bindHooks(
  instance: object,
  lifecycle: string,
  callback: IAnyFunction | undefined,
) {
  if (!callback) {
    return;
  }
  if (!lifecycleListeners.has(instance)) {
    lifecycleListeners.set(instance, new Map());
  }
  const listeners = lifecycleListeners.get(instance)!;
  if (!listeners.has(lifecycle)) {
    listeners.set(lifecycle, []);
  }
  const list = listeners.get(lifecycle)!;
  if (callback) {
    list.push(callback);
  }
}

export function createTriggerFn(lifecycle: string) {
  return function (this: object, ...args: unknown[]) {
    return triggerLifecycle(this, lifecycle, args);
  };
}

export function triggerLifecycle(
  instance: object,
  lifecycle: string,
  args: unknown[] = [],
) {
  if (!lifecycleListeners.has(instance)) {
    return;
  }
  const listeners = lifecycleListeners.get(instance)!;
  if (!listeners.has(lifecycle)) {
    return;
  }
  let res: unknown;
  for (const callback of listeners.get(lifecycle)!) {
    res = callback(...args);
  }
  return res;
}

export function getListeners(instance: object, lifecycle: string) {
  return lifecycleListeners.get(instance)?.get(lifecycle);
}
