export {
  // core
  reactive,
  ref,
  readonly,
  // utilities
  unref,
  proxyRefs,
  isRef,
  toRef,
  toValue,
  toRefs,
  isProxy,
  isReactive,
  isReadonly,
  isShallow,
  // advanced
  customRef,
  triggerRef,
  shallowRef,
  shallowReactive,
  shallowReadonly,
  markRaw,
  toRaw,
  // effect
  effect,
  stop,
  getCurrentWatcher,
  onWatcherCleanup,
  ReactiveEffect,
  // effect scope
  effectScope,
  EffectScope,
  getCurrentScope,
  onScopeDispose,
  // computed
  computed,
  // types
  type Ref,
  type MaybeRef,
  type MaybeRefOrGetter,
  type ToRef,
  type ToRefs,
  type UnwrapRef,
  type ShallowRef,
  type ShallowUnwrapRef,
  type CustomRefFactory,
  type ReactiveFlags,
  type DeepReadonly,
  type ShallowReactive,
  type UnwrapNestedRefs,
  type ComputedRef,
  type WritableComputedRef,
  type WritableComputedOptions,
  type ComputedGetter,
  type ComputedSetter,
  type ReactiveEffectRunner,
  type ReactiveEffectOptions,
  type EffectScheduler,
  type DebuggerOptions,
  type DebuggerEvent,
  type DebuggerEventExtraInfo,
  type Raw,
  type Reactive,
} from '@vue/reactivity';

export {
  createApp,
  type AppSetupContext,
  type AppSetupFn,
  type AppOptions,
} from './apiCreateApp';

export {
  defineComponent,
  type ComponentSetupContext,
  type ComponentSetupFn,
  type CommonComponentOptions,
  type ComponentOptionsWithoutProps,
  type ComponentOptionsWithProps,
} from './apiDefineComponent';

export {
  onAppShow,
  onAppHide,
  onAppError,
  onPageNotFound,
  onUnhandledRejection,
  onThemeChange,
  onDetached,
  onReady,
  onMoved,
  onError,
  onLoad,
  onShow,
  onHide,
  onUnload,
  onRouteDone,
  onPullDownRefresh,
  onReachBottom,
  onPageScroll,
  onAddToFavorites,
  onShareAppMessage,
  onShareTimeline,
  onResize,
  onTabItemTap,
  onSaveExitState,
} from './apiLifecycle';

export {
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  type MultiWatchSources,
  type WatchEffect,
  type WatchOptions,
  type WatchEffectOptions as WatchOptionsBase,
  type WatchCallback,
  type WatchSource,
  type WatchHandle,
  type WatchStopHandle,
} from './apiWatch';

export { nextTick } from './apiGlobal';

export { getCurrentInstance, useEmits, useProps } from './apiComponent';
