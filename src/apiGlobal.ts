import { currentInstance } from './shared/instance';

export { nextTick } from './vue/scheduler';

export function getCurrentInstance() {
  return currentInstance?.instance;
}
