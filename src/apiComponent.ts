import { currentInstance } from './shared/instance';

export function getCurrentInstance() {
  return currentInstance?.instance;
}

export function useEmits(): WechatMiniprogram.Component.TrivialInstance['triggerEvent'] {
  const component = currentInstance?.instance;
  if (!currentInstance && __DEV__) {
    throw new Error('useEmits() can only be used in setup().');
  }
  return (name, detail, options) => {
    if (component) {
      component.triggerEvent(name, detail, options);
    }
  };
}

export function useProps<T extends Record<string, unknown>>(): T {
  if (!currentInstance && __DEV__) {
    throw new Error('useProps() can only be used in setup().');
  }
  return currentInstance!.props as T;
}
