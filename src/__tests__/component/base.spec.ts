import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  defineComponent,
  computed,
  nextTick,
  isReadonly,
  onReady,
  onMoved,
  onDetached,
  onError,
  onLoad,
  onShow,
  onHide,
  onRouteDone,
  onPullDownRefresh,
  onReachBottom,
  onResize,
  onTabItemTap,
  onPageScroll,
  onShareAppMessage,
  onShareTimeline,
} from '../..';
import { currentInstance, setCurrentInstance } from '../../shared/instance';
import { component } from '../shared/globals';

describe('component', () => {
  beforeEach(() => {
    setCurrentInstance(undefined);
  });

  afterEach(() => {
    currentInstance?.scope.stop();
  });

  it('props', async () => {
    defineComponent({
      properties: {
        count: Number,
      },
      setup(props) {
        expect(isReadonly(props)).toBe(true);
        expect(props.count).toBe(0);
        const double = computed(() => props.count * 2);
        return { double };
      },
    });

    component.data = { count: 0 };
    component.observers.count.call(component, component.data.count);
    component.lifetimes.attached.call(component);
    expect(component.data.double).toBe(0);

    component.data.count = 1;
    component.observers.count.call(component, component.data.count);
    await nextTick();
    expect(component.data.double).toBe(2);
  });

  it('multiple instances', async () => {
    defineComponent({
      properties: {
        count: Number,
      },
      setup(props) {
        const double = computed(() => props.count * 2);
        return { double };
      },
    });

    const instance1 = Object.create(component);
    const instance2 = Object.create(component);

    instance1.data = { count: 0 };
    instance1.observers.count.call(instance1, instance1.data.count);
    instance1.lifetimes.attached.call(instance1);

    instance2.data = { count: 1 };
    instance2.observers.count.call(instance2, instance2.data.count);
    instance2.lifetimes.attached.call(instance2);

    expect(instance1.data.double).toBe(0);
    expect(instance2.data.double).toBe(2);

    instance1.data.count = 1;
    instance2.data.count = 2;
    instance1.observers.count.call(instance1, instance1.data.count);
    instance2.observers.count.call(instance2, instance2.data.count);
    await nextTick();
    expect(instance1.data.double).toBe(2);
    expect(instance2.data.double).toBe(4);
  });

  it('observer', () => {
    const fn = vi.fn();
    defineComponent({
      properties: {
        count: Number,
      },
      setup() {},
      observers: {
        count: fn,
      },
    });

    component.data = { count: 0 };
    component.lifetimes.attached.call(component);
    component.observers.count.call(component, component.data.count);
    expect(fn).toBeCalledWith(0);
  });

  it('context', () => {
    defineComponent((_, context) => {
      expect(context.triggerEvent).toBeInstanceOf(Function);
      return { num: 0 };
    });

    component.lifetimes.attached.call(component);
    expect(component.data.num).toBe(0);
  });

  it('attached', () => {
    const fn = vi.fn();

    defineComponent({
      lifetimes: { attached: fn },
      setup() {},
    });

    component.lifetimes.attached.call(component);
    expect(fn).toBeCalledTimes(1);
  });

  it('ready', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    defineComponent({
      lifetimes: { ready: fn },
      setup() {
        onReady(injectedFn1);
        onReady(injectedFn2);
      },
    });

    component.lifetimes.attached.call(component);
    component.lifetimes.ready.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('moved', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();
    defineComponent({
      lifetimes: { moved: fn },
      setup() {
        onMoved(injectedFn1);
        onMoved(injectedFn2);
      },
    });
    component.lifetimes.attached.call(component);
    component.lifetimes.moved.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('detached', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();
    defineComponent({
      lifetimes: { detached: fn },
      setup() {
        onDetached(injectedFn1);
        onDetached(injectedFn2);
      },
    });
    component.lifetimes.attached.call(component);
    component.lifetimes.detached.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('error', () => {
    const error = new Error('unknown');
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();
    defineComponent({
      lifetimes: { error: fn },
      setup() {
        onError(injectedFn1);
        onError(injectedFn2);
      },
    });
    component.lifetimes.attached.call(component);
    component.lifetimes.error.call(component, error);
    expect(fn).toBeCalledWith(error);
    expect(injectedFn1).toBeCalledWith(error);
    expect(injectedFn2).toBeCalledWith(error);
  });

  it('onLoad', () => {
    const arg = {};
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();
    defineComponent({
      methods: { onLoad: fn },
      setup() {
        onLoad(injectedFn1);
        onLoad(injectedFn2);
      },
    });
    component.lifetimes.attached.call(component);
    component.methods.onLoad.call(component, arg);
    expect(fn).toBeCalledWith(arg);
    expect(injectedFn1).toBeCalledWith(arg);
    expect(injectedFn2).toBeCalledWith(arg);
  });

  it('onPullDownRefresh', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();
    defineComponent({
      methods: { onPullDownRefresh: fn },
      setup() {
        onPullDownRefresh(injectedFn1);
        onPullDownRefresh(injectedFn2);
      },
    });
    component.lifetimes.attached.call(component);
    component.methods.onPullDownRefresh.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('onReachBottom', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();
    defineComponent({
      methods: { onReachBottom: fn },
      setup() {
        onReachBottom(injectedFn1);
        onReachBottom(injectedFn2);
      },
    });
    component.lifetimes.attached.call(component);
    component.methods.onReachBottom.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('onTabItemTap', () => {
    const arg = {};
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();
    defineComponent({
      methods: { onTabItemTap: fn },
      setup() {
        onTabItemTap(injectedFn1);
        onTabItemTap(injectedFn2);
      },
    });
    component.lifetimes.attached.call(component);
    component.methods.onTabItemTap.call(component, arg);
    expect(fn).toBeCalledWith(arg);
    expect(injectedFn1).toBeCalledWith(arg);
    expect(injectedFn2).toBeCalledWith(arg);
  });

  describe('onPageScroll', () => {
    it('disabled by default', () => {
      defineComponent({
        setup() {
          onPageScroll(() => {});
        },
      });

      expect(component.methods.onPageScroll).toBeFalsy();
    });

    it('bind', () => {
      const arg = {};
      const fn = vi.fn();
      const injectedFn1 = vi.fn();
      const injectedFn2 = vi.fn();

      defineComponent({
        methods: { onPageScroll: fn },
        setup() {
          onPageScroll(injectedFn1);
          onPageScroll(injectedFn2);
        },
      });

      component.__listenPageScroll__ = component.methods.__listenPageScroll__;
      component.lifetimes.attached.call(component);
      component.methods.onPageScroll.call(component, arg);
      expect(fn).toBeCalledWith(arg);
      expect(injectedFn1).toBeCalledWith(arg);
      expect(injectedFn2).toBeCalledWith(arg);
    });

    it('listen with listenPageScroll: true', () => {
      const arg = {};
      const injectedFn = vi.fn();

      defineComponent({
        listenPageScroll: true,
        setup() {
          onPageScroll(injectedFn);
        },
      });

      component.__listenPageScroll__ = component.methods.__listenPageScroll__;
      component.lifetimes.attached.call(component);
      component.methods.onPageScroll.call(component, arg);
      expect(injectedFn).toBeCalledWith(arg);
    });
  });

  describe('onShareAppMessage', () => {
    it('disabled by default', () => {
      const fn = vi.fn();

      defineComponent(() => {
        onShareAppMessage(fn);
      });

      component.lifetimes.attached.call(component);
      expect(component.methods.onShareAppMessage).toBeFalsy();
    });

    it('canShareAppMessage: true', () => {
      const arg = {};
      const fn = vi.fn(() => ({ title: 'test' }));

      defineComponent({
        canShareAppMessage: true,
        setup() {
          onShareAppMessage(fn);
        },
      });

      component.lifetimes.attached.call(component);
      const res = component.methods.onShareAppMessage.call(component, arg);
      expect(fn).toHaveBeenCalledWith(arg);
      expect(res).toEqual({ title: 'test' });
    });

    it('bind multiple times', () => {
      expect(() => {
        defineComponent({
          methods: {
            onShareAppMessage() {
              return {};
            },
          },
          setup() {
            onShareAppMessage(() => ({}));
          },
        });
        component.lifetimes.attached.call(component);
      }).toThrowError('onShareAppMessage is registered more than once');

      expect(() => {
        defineComponent(() => {
          onShareAppMessage(() => ({}));
          onShareAppMessage(() => ({}));
        });
        component.lifetimes.attached.call(component);
      }).toThrowError('onShareAppMessage is registered more than once');
    });
  });

  describe('onShareTimeline', () => {
    it('disabled by default', () => {
      const fn = vi.fn();

      defineComponent(() => {
        onShareTimeline(fn);
      });

      component.lifetimes.attached.call(component);
      expect(component.methods.onShareTimeline).toBeFalsy();
    });

    it('bind', () => {
      const arg = {};
      const fn = vi.fn(() => ({ title: 'test' }));

      defineComponent({
        setup() {},
        methods: {
          onShareTimeline: fn,
        },
      });

      component.lifetimes.attached.call(component);
      const res = component.methods.onShareTimeline.call(component, arg);
      expect(fn).toHaveBeenCalledWith(arg);
      expect(res).toEqual({ title: 'test' });
    });
  });

  it('onShow', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    defineComponent({
      pageLifetimes: { show: fn },
      setup() {
        onShow(injectedFn1);
        onShow(injectedFn2);
      },
    });

    component.lifetimes.attached.call(component);
    component.pageLifetimes.show.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('onHide', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    defineComponent({
      pageLifetimes: { hide: fn },
      setup() {
        onHide(injectedFn1);
        onHide(injectedFn2);
      },
    });

    component.lifetimes.attached.call(component);
    component.pageLifetimes.hide.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('onResize', () => {
    const arg = {};
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    defineComponent({
      pageLifetimes: { resize: fn },
      setup() {
        onResize(injectedFn1);
        onResize(injectedFn2);
      },
    });

    component.lifetimes.attached.call(component);
    component.pageLifetimes.resize.call(component, arg);
    expect(fn).toBeCalledWith(arg);
    expect(injectedFn1).toBeCalledWith(arg);
    expect(injectedFn2).toBeCalledWith(arg);
  });

  it('onRouteDone', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    defineComponent({
      pageLifetimes: { routeDone: fn },
      setup() {
        onRouteDone(injectedFn1);
        onRouteDone(injectedFn2);
      },
    });

    component.lifetimes.attached.call(component);
    component.pageLifetimes.routeDone.call(component);
    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('inject component lifecycle outside setup', () => {
    expect(() => {
      onMoved(() => {});
    }).toThrowError(
      'there is no active component instance to be associated with',
    );
  });

  it('no setup', () => {
    const options = {};
    defineComponent(options);
    expect(component).toBeInstanceOf(Object);
  });
});
