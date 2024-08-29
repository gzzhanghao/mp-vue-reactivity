export { isFunction } from '../shared/utils';

export const EMPTY_OBJ = {};

export const NOOP = () => {};

export const warn = __DEV__ ? console.warn : NOOP;

export function isArray(x: unknown): x is any[] {
  return Array.isArray(x);
}
