import { ComponentInternalInstance } from '../shared/internal';
import { IAnyFunction } from '../shared/types';

import { isArray, isFunction, warn } from './shared';

export function callWithErrorHandling(
  fn: IAnyFunction,
  instance: ComponentInternalInstance | undefined,
  type: string,
  args?: unknown[],
): any {
  try {
    return args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance, type);
  }
}

export function callWithAsyncErrorHandling(
  fn: IAnyFunction | IAnyFunction[],
  instance: ComponentInternalInstance | undefined,
  type: string,
  args?: unknown[],
): any {
  if (isFunction(fn)) {
    return callWithErrorHandling(fn, instance, type, args);
  }

  if (isArray(fn)) {
    const values = [];
    for (let i = 0; i < fn.length; i++) {
      values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
    }
    return values;
  } else if (__DEV__) {
    warn(
      `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof fn}`,
    );
  }
}

export function handleError(
  error: unknown,
  instance: ComponentInternalInstance | undefined,
  type: string,
): void {
  if (__DEV__) {
    let msg = `Unhandled error`;
    if (type) {
      msg += ` during execution of ${type}`;
    }
    if (instance?.instance.is) {
      msg += ` in component ${instance.instance.is}`;
    }
    warn(msg);
    throw error;
  }
  console.error(error);
}
