import { AppOptions } from '../../apiCreateApp';
import { IAnyObject } from '../../shared/types';

export let app: Required<AppOptions<IAnyObject>>;

export let component: Record<string, any>;
export let nextTickCb: () => void;

const global: any = globalThis;

global.wx = {
  nextTick(cb: () => void) {
    nextTickCb = () => {
      cb();
      nextTickCb = undefined as any;
    };
  },
};

global.App = (options: any) => {
  app = options;
};

global.Component = (options: Record<string, any>) => {
  component = {
    ...options,
    data: options.data || {},
    triggerEvent() {},
    setData(data: Record<string, unknown>) {
      this.data = this.data || {};
      for (const key of Object.keys(data)) {
        this.data[key] = data[key];
      }
    },
  };
};
