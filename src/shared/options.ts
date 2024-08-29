import { IAnyFunction } from './types';
import { isFunction } from './utils';

export function normalizeOptions<
  TSetup extends IAnyFunction,
  TOptions extends { setup?: TSetup },
>(
  optionsOrSetup: TSetup | TOptions,
): {
  setup?: TSetup;
  options: TOptions;
} {
  if (isFunction<TSetup>(optionsOrSetup)) {
    return { setup: optionsOrSetup, options: {} as TOptions };
  }
  if (!isFunction(optionsOrSetup.setup)) {
    return { options: optionsOrSetup };
  }
  return {
    setup: optionsOrSetup.setup,
    options: optionsOrSetup,
  };
}
