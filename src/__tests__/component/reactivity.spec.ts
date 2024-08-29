import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  defineComponent,
  ref,
  reactive,
  computed,
  readonly,
  watch,
  watchEffect,
  watchPostEffect,
  nextTick,
  effectScope,
} from '../..';
import { currentInstance, setCurrentInstance } from '../../shared/instance';
import { component, nextTickCb } from '../shared/globals';

describe('component reactivity', () => {
  beforeEach(() => {
    setCurrentInstance(undefined);
  });

  afterEach(() => {
    currentInstance?.scope.stop();
  });

  it('raw binding', () => {
    defineComponent(() => {
      const count = 0;
      return { count };
    });

    component.lifetimes.attached.call(component);
    expect(component.data.count).toBe(0);
  });

  it('ref binding', async () => {
    defineComponent(() => {
      const count = ref(0);
      const double = computed(() => count.value * 2);

      const increment = () => {
        count.value++;
      };

      const add = ref(increment);

      return {
        add,
        count,
        double,
        increment,
      };
    });

    component.lifetimes.attached.call(component);
    expect(component.data.count).toBe(0);
    expect(component.data.double).toBe(0);
    expect(component.data.add).toBeInstanceOf(Function);

    component.increment();
    await nextTick();
    expect(component.data.count).toBe(1);
    expect(component.data.double).toBe(2);
  });

  it('reactive binding', async () => {
    defineComponent(() => {
      const state: { count: number; double: number } = reactive({
        count: 0,
        double: computed(() => state.count * 2),
      });

      const increment = () => {
        state.count++;
      };

      return {
        state,
        increment,
      };
    });

    component.lifetimes.attached.call(component);
    expect(component.data.state).toEqual({ count: 0, double: 0 });

    component.increment();
    await nextTick();
    expect(component.data.state).toEqual({ count: 1, double: 2 });
  });

  it('readonly binding', () => {
    defineComponent(() => {
      const state = readonly({ count: 0 });
      return { state };
    });

    component.lifetimes.attached.call(component);
    expect(component.data.state).toEqual({ count: 0 });
  });

  it('array binding', async () => {
    defineComponent(() => {
      const count = ref(0);
      const double = computed(() => count.value * 2);

      const increment = () => {
        count.value++;
      };

      return {
        arr: [count, double],
        increment,
      };
    });

    component.lifetimes.attached.call(component);
    expect(component.data.arr).toEqual([0, 0]);

    component.increment();
    await nextTick();
    expect(component.data.arr).toEqual([1, 2]);
  });

  it('object binding', async () => {
    defineComponent(() => {
      const count = ref(0);
      const double = computed(() => count.value * 2);

      const increment = () => {
        count.value++;
      };

      return {
        obj: { count, double },
        increment,
      };
    });

    component.lifetimes.attached.call(component);
    expect(component.data.obj).toEqual({ count: 0, double: 0 });

    component.increment();
    await nextTick();
    expect(component.data.obj).toEqual({ count: 1, double: 2 });
  });

  it('unbundling', async () => {
    defineComponent(() => {
      const count = ref(0);
      const double = computed(() => count.value * 2);

      const increment = () => {
        count.value++;
      };

      return {
        count,
        double,
        increment,
      };
    });

    component.lifetimes.attached.call(component);

    component.increment();
    component.lifetimes.detached.call(component);
    await nextTick();
    expect(component.data.count).toBe(0);
    expect(component.data.double).toBe(0);
  });

  it('watch', async () => {
    let dummy: number;
    let stopper: () => void;

    defineComponent(() => {
      const count = ref(0);

      const increment = () => {
        count.value++;
      };

      stopper = watchEffect(() => {
        dummy = count.value;
      });

      return {
        count,
        increment,
      };
    });

    component.lifetimes.attached.call(component);
    await nextTick();
    expect(dummy!).toBe(0);
    expect(component.data.count).toBe(0);
    expect(component.__internal__.scope.effects.length).toBe(2);

    component.increment();
    await nextTick();
    expect(dummy!).toBe(1);
    expect(component.data.count).toBe(1);

    stopper!();
    component.increment();
    await nextTick();
    expect(dummy!).toBe(1);
    expect(component.data.count).toBe(2);
    expect(component.__internal__.scope.effects.length).toBe(1);
  });

  it('post watch', async () => {
    let foo: number | undefined;
    let bar: number | undefined;

    defineComponent(() => {
      const count = ref(0);

      const increment = () => {
        count.value++;
      };

      watchPostEffect(() => {
        foo = count.value;
      });

      watch(
        count,
        () => {
          bar = count.value;
        },
        { flush: 'post' },
      );

      return {
        count,
        increment,
      };
    });

    component.lifetimes.attached.call(component);
    nextTickCb();
    expect(foo).toBe(0);
    expect(bar).toBe(undefined);
    expect(component.data.count).toBe(0);

    component.increment();
    await nextTick();
    expect(foo).toBe(0);
    expect(bar).toBe(undefined);
    expect(component.data.count).toBe(1);

    nextTickCb();
    expect(foo).toBe(1);
    expect(bar).toBe(1);
    expect(component.data.count).toBe(1);
  });

  it('watch should not register in owner component if created inside detached scope', () => {
    defineComponent(() => {
      effectScope(true).run(() => {
        watch(
          () => 1,
          () => {},
        );
      });
      return {};
    });

    component.lifetimes.attached.call(component);
    expect(component.__internal__.scope.effects.length).toBe(0);
  });
});
