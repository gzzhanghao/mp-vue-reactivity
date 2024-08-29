import { isProxy, isRef, toRaw } from '@vue/reactivity';

import { isArray } from '../vue/shared';

import { isObject, isPlainObject } from './utils';

export function unrefDeep(x: unknown): unknown {
  if (!x || !isObject(x)) {
    return x;
  }

  if (isRef(x)) {
    return unrefDeep(x.value);
  }

  if (isProxy(x)) {
    return unrefDeep(toRaw(x));
  }

  if (isArray(x)) {
    return x.map((item) => unrefDeep(item));
  }

  if (isPlainObject(x)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(x)) {
      result[key] = unrefDeep(x[key]);
    }
    return result;
  }

  return x;
}
