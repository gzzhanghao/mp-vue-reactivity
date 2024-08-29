import { describe, expect, it, vi } from 'vitest';

import {
  flushJobs,
  nextTick,
  queueJob,
  queuePostCb,
  SchedulerJob,
  SchedulerJobFlags,
} from '../vue/scheduler';

import { nextTickCb } from './shared/globals';

describe('scheduler', () => {
  it('nextTick', async () => {
    const calls: string[] = [];
    const dummyThen = Promise.resolve().then();

    const job1 = () => {
      calls.push('job1');
    };

    const job2 = () => {
      calls.push('job2');
    };

    nextTick(job1);
    job2();

    expect(calls.length).toBe(1);
    await dummyThen;
    // Job1 will be pushed in nextTick
    expect(calls.length).toBe(2);
    expect(calls).toMatchObject(['job2', 'job1']);
  });

  describe('queueJob', () => {
    it('basic usage', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
      };

      const job2 = () => {
        calls.push('job2');
      };

      queueJob(job1);
      queueJob(job2);
      expect(calls).toEqual([]);

      await nextTick();
      expect(calls).toEqual(['job1', 'job2']);
    });

    it('should dedupe queued jobs', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
      };

      const job2 = () => {
        calls.push('job2');
      };

      queueJob(job1);
      queueJob(job2);
      queueJob(job1);
      queueJob(job2);
      expect(calls).toEqual([]);

      await nextTick();
      expect(calls).toEqual(['job1', 'job2']);
    });

    it('queueJob while flushing', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
        // Job2 will be executed after job1 at the same tick
        queueJob(job2);
      };

      const job2 = () => {
        calls.push('job2');
      };

      queueJob(job1);

      await nextTick();
      expect(calls).toEqual(['job1', 'job2']);
    });
  });

  describe('queuePostFlushCb', () => {
    it('basic usage', async () => {
      const calls: string[] = [];

      const cb1 = () => {
        calls.push('cb1');
      };

      const cb2 = () => {
        calls.push('cb2');
      };

      queuePostCb(cb1);
      queuePostCb(cb2);

      await Promise.resolve();
      expect(calls).toEqual([]);

      nextTickCb();
      expect(calls).toEqual(['cb1', 'cb2']);
    });

    it('should dedupe queued postFlushCb', async () => {
      const calls: string[] = [];

      const cb1 = () => {
        calls.push('cb1');
      };

      const cb2 = () => {
        calls.push('cb2');
      };

      const cb3 = () => {
        calls.push('cb3');
      };

      queuePostCb(cb1);
      queuePostCb(cb2);
      queuePostCb(cb3);

      queuePostCb(cb1);
      queuePostCb(cb3);
      queuePostCb(cb2);

      await Promise.resolve();
      expect(calls).toEqual([]);

      nextTickCb();
      expect(calls).toEqual(['cb1', 'cb2', 'cb3']);
    });

    it('queuePostFlushCb while flushing', async () => {
      const calls: string[] = [];

      const cb1 = () => {
        calls.push('cb1');
        // Cb2 will be executed after cb1 at the same tick
        queuePostCb(cb2);
      };

      const cb2 = () => {
        calls.push('cb2');
      };

      queuePostCb(cb1);

      await Promise.resolve();
      nextTickCb();
      expect(calls).toEqual(['cb1']);

      await Promise.resolve();
      nextTickCb();
      expect(calls).toEqual(['cb1', 'cb2']);
    });
  });

  describe('queueJob w/ queuePostFlushCb', () => {
    it('queueJob inside postFlushCb', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
      };

      const cb1 = () => {
        // QueueJob in postFlushCb
        calls.push('cb1');
        queueJob(job1);
      };

      queuePostCb(cb1);
      await Promise.resolve();
      nextTickCb();
      expect(calls).toEqual(['cb1']);

      await Promise.resolve();
      expect(calls).toEqual(['cb1', 'job1']);
    });

    it('queueJob & postFlushCb inside postFlushCb', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
      };

      const cb1 = () => {
        calls.push('cb1');
        queuePostCb(cb2);
        // Job1 will executed before cb2
        // Job has higher priority than postFlushCb
        queueJob(job1);
      };

      const cb2 = () => {
        calls.push('cb2');
      };

      queuePostCb(cb1);
      await Promise.resolve();
      nextTickCb();
      expect(calls).toEqual(['cb1']);

      await Promise.resolve();
      expect(calls).toEqual(['cb1', 'job1']);

      nextTickCb();
      expect(calls).toEqual(['cb1', 'job1', 'cb2']);
    });

    it('postFlushCb inside queueJob', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
        // PostFlushCb in queueJob
        queuePostCb(cb1);
      };

      const cb1 = () => {
        calls.push('cb1');
      };

      queueJob(job1);
      await Promise.resolve();
      expect(calls).toEqual(['job1']);

      nextTickCb();
      expect(calls).toEqual(['job1', 'cb1']);
    });

    it('queueJob & postFlushCb inside queueJob', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
        // Cb1 will executed after job2
        // Job has higher priority than postFlushCb
        queuePostCb(cb1);
        queueJob(job2);
      };

      const job2 = () => {
        calls.push('job2');
      };

      const cb1 = () => {
        calls.push('cb1');
      };

      queueJob(job1);
      await Promise.resolve();
      expect(calls).toEqual(['job1', 'job2']);

      nextTickCb();
      expect(calls).toEqual(['job1', 'job2', 'cb1']);
    });

    it('nested queueJob w/ postFlushCb', async () => {
      const calls: string[] = [];

      const job1 = () => {
        calls.push('job1');
        queuePostCb(cb1);
        queueJob(job2);
      };

      const job2 = () => {
        calls.push('job2');
        queuePostCb(cb2);
      };

      const cb1 = () => {
        calls.push('cb1');
      };

      const cb2 = () => {
        calls.push('cb2');
      };

      queueJob(job1);
      await Promise.resolve();
      expect(calls).toEqual(['job1', 'job2']);

      nextTickCb();
      expect(calls).toEqual(['job1', 'job2', 'cb1', 'cb2']);
    });
  });

  // #1595
  it('avoid duplicate postFlushCb invocation', async () => {
    const calls: string[] = [];

    const cb1 = () => {
      calls.push('cb1');
      queuePostCb(cb2);
    };

    const cb2 = () => {
      calls.push('cb2');
    };

    queuePostCb(cb1);
    queuePostCb(cb2);
    await Promise.resolve();
    nextTickCb();
    expect(calls).toEqual(['cb1', 'cb2']);

    await Promise.resolve();
    expect(nextTickCb).toBeFalsy();
    expect(calls).toEqual(['cb1', 'cb2']);
  });

  it('nextTick should capture scheduler flush errors', async () => {
    const error = new Error('test');

    queueJob(() => {
      throw error;
    });
    expect(flushJobs).toThrow(error);

    queuePostCb(() => {});
    await Promise.resolve();
    nextTickCb();
  });

  it('should prevent self-triggering jobs by default', async () => {
    let count = 0;

    const job = () => {
      if (count < 3) {
        count++;
        queueJob(job);
      }
    };

    queueJob(job);
    await Promise.resolve();
    // Only runs once - a job cannot queue itself
    expect(count).toBe(1);
  });

  it('should allow explicitly marked jobs to trigger itself', async () => {
    // Normal job
    let count = 0;

    const job: SchedulerJob = () => {
      if (count < 3) {
        count++;
        queueJob(job);
      }
    };

    job.flags! |= SchedulerJobFlags.ALLOW_RECURSE;
    queueJob(job);
    await Promise.resolve();
    expect(count).toBe(3);
  });

  it('should allow recurse post callbacks', async () => {
    let count = 0;

    // Post cb
    const cb: SchedulerJob = () => {
      if (count < 3) {
        count++;
        queuePostCb(cb);
      }
    };

    cb.flags! |= SchedulerJobFlags.ALLOW_RECURSE;
    queuePostCb(cb);

    await Promise.resolve();
    nextTickCb();
    expect(count).toBe(1);

    await Promise.resolve();
    nextTickCb();
    expect(count).toBe(2);

    await Promise.resolve();
    nextTickCb();
    expect(count).toBe(3);
  });

  it('nextTick should return promise', async () => {
    const fn = vi.fn(() => 1);

    const p = nextTick(fn);

    expect(p).toBeInstanceOf(Promise);
    expect(await p).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
