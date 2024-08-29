import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createApp,
  ref,
  computed,
  watchEffect,
  nextTick,
  onAppShow,
  onAppHide,
  onAppError,
  onPageNotFound,
  onUnhandledRejection,
  onThemeChange,
} from '..';
import { setCurrentApp } from '../shared/instance';

import { app } from './shared/globals';

const dummyArg: any = {};

describe('app', () => {
  beforeEach(() => {
    setCurrentApp(undefined);
  });

  it('binding', async () => {
    createApp(() => {
      const num = 0;
      const count = ref(0);
      const double = computed(() => count.value * 2);

      const increment = () => {
        count.value++;
      };

      return {
        num,
        count,
        double,
        increment,
      };
    });

    app.onLaunch(dummyArg);

    expect(app.num).toBe(0);
    expect(app.count.value).toBe(0);
    expect(app.double.value).toBe(0);

    let dummy;
    watchEffect(() => {
      dummy = app.count.value;
    });
    await nextTick();
    expect(dummy).toBe(0);

    app.increment();
    expect(app.count.value).toBe(1);
    expect(app.double.value).toBe(2);

    await nextTick();
    expect(dummy).toBe(1);
  });

  it('onLaunch', () => {
    const onLaunch = vi.fn();
    const setup = vi.fn();

    createApp({ onLaunch, setup });
    app.onLaunch(dummyArg);

    expect(onLaunch).toBeCalledWith(dummyArg);
    expect(setup).toBeCalledWith(dummyArg, { app });
  });

  it('onShow', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    createApp({
      onShow: fn,
      setup() {
        onAppShow(injectedFn1);
        onAppShow(injectedFn2);
      },
    });

    app.onLaunch(dummyArg);
    app.onShow(dummyArg);

    expect(fn).toBeCalledWith(dummyArg);
    expect(injectedFn1).toBeCalledWith(dummyArg);
    expect(injectedFn2).toBeCalledWith(dummyArg);
  });

  it('onHide', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    createApp({
      onHide: fn,
      setup() {
        onAppHide(injectedFn1);
        onAppHide(injectedFn2);
      },
    });

    app.onLaunch(dummyArg);
    app.onHide();

    expect(fn).toBeCalledTimes(1);
    expect(injectedFn1).toBeCalledTimes(1);
    expect(injectedFn2).toBeCalledTimes(1);
  });

  it('onError', () => {
    const arg = '';

    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    createApp({
      onError: fn,
      setup() {
        onAppError(injectedFn1);
        onAppError(injectedFn2);
      },
    });

    app.onLaunch(dummyArg);
    app.onError(arg);

    expect(fn).toBeCalledWith(arg);
    expect(injectedFn1).toBeCalledWith(arg);
    expect(injectedFn2).toBeCalledWith(arg);
  });

  it('onPageNotFound', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    createApp({
      onPageNotFound: fn,
      setup() {
        onPageNotFound(injectedFn1);
        onPageNotFound(injectedFn2);
      },
    });

    app.onLaunch(dummyArg);
    app.onPageNotFound(dummyArg);

    expect(fn).toBeCalledWith(dummyArg);
    expect(injectedFn1).toBeCalledWith(dummyArg);
    expect(injectedFn2).toBeCalledWith(dummyArg);
  });

  it('onUnhandledRejection', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    createApp({
      onUnhandledRejection: fn,
      setup() {
        onUnhandledRejection(injectedFn1);
        onUnhandledRejection(injectedFn2);
      },
    });

    app.onLaunch(dummyArg);
    app.onUnhandledRejection(dummyArg);

    expect(fn).toBeCalledWith(dummyArg);
    expect(injectedFn1).toBeCalledWith(dummyArg);
    expect(injectedFn2).toBeCalledWith(dummyArg);
  });

  it('onThemeChange', () => {
    const fn = vi.fn();
    const injectedFn1 = vi.fn();
    const injectedFn2 = vi.fn();

    createApp({
      onThemeChange: fn,
      setup() {
        onThemeChange(injectedFn1);
        onThemeChange(injectedFn2);
      },
    });

    app.onLaunch(dummyArg);
    app.onThemeChange(dummyArg);

    expect(fn).toBeCalledWith(dummyArg);
    expect(injectedFn1).toBeCalledWith(dummyArg);
    expect(injectedFn2).toBeCalledWith(dummyArg);
  });

  it('inject lifecycle outside setup', () => {
    expect(() => {
      onAppShow(() => {});
    }).toThrowError('no active component instance to be associated with');
  });

  it('no injected lifecycle', () => {
    const fn = vi.fn();

    createApp({
      onHide: fn,
      setup() {
        return { num: 0 };
      },
    });

    app.onLaunch(dummyArg);
    expect(app.num).toBe(0);

    app.onHide();
    expect(fn).toBeCalledTimes(1);
  });

  it('only injected lifecycle', () => {
    const fn = vi.fn();

    createApp(() => {
      onAppHide(fn);
    });

    app.onLaunch(dummyArg);
    app.onHide();

    expect(fn).toBeCalledTimes(1);
  });

  it('no setup', () => {
    createApp(dummyArg);

    expect(app).toBeInstanceOf(Object);
  });
});
