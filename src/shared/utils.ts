export function keys(obj: Record<string, unknown>) {
  if (!isObject(obj)) {
    return [];
  }
  return Object.keys(obj);
}

export function isFunction<T extends (...args: any[]) => any>(
  x: unknown,
): x is T {
  return typeof x === 'function';
}

export function isObject(x: unknown): x is object {
  if (!x) {
    return false;
  }
  return typeof x === 'object';
}

export function exclude<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const ret: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (!keys.includes(key as K)) {
      ret[key] = obj[key];
    }
  }
  return ret as Omit<T, K>;
}

export function isPlainObject(x: unknown): x is Record<string, unknown> {
  return getType(x) === 'Object';
}

export function getType(x: unknown): string {
  return Object.prototype.toString.call(x).slice(8, -1);
}
