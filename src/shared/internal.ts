import { EffectScope } from '@vue/reactivity';

import { SchedulerJob } from '../vue/scheduler';

export interface ComponentInternalInstance {
  uid: number;
  instance: WechatMiniprogram.Component.TrivialInstance;
  props: Record<string, unknown>;
  scope: EffectScope;
  flushJob?: SchedulerJob;
}

const internalMap = new WeakMap<object, ComponentInternalInstance>();
let nextUid = 0;

export function createInternal(
  instance: WechatMiniprogram.Component.TrivialInstance,
  props: Record<string, unknown>,
) {
  const internal: ComponentInternalInstance = {
    uid: ++nextUid,
    instance,
    props,
    scope: new EffectScope(),
  };
  internalMap.set(instance, internal);
  return internal;
}

export function getInternal(instance: object) {
  return internalMap.get(instance);
}
