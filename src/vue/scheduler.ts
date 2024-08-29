import { ComponentInternalInstance } from '../shared/internal';
import { IAnyFunction } from '../shared/types';

import { callWithErrorHandling, handleError } from './errorHandling';
import { NOOP } from './shared';

export enum SchedulerJobFlags {
  QUEUED = 1 << 0,
  PRE = 1 << 1,
  /**
   * Indicates whether the effect is allowed to recursively trigger itself
   * when managed by the scheduler.
   *
   * By default, a job cannot trigger itself because some built-in method calls,
   * e.g. Array.prototype.push actually performs reads as well (#1740) which
   * can lead to confusing infinite loops.
   * The allowed cases are component update functions and watch callbacks.
   * Component update functions may update child component props, which in turn
   * trigger flush: "pre" watch callbacks that mutates state that the parent
   * relies on (#1801). Watch callbacks doesn't track its dependencies so if it
   * triggers itself again, it's likely intentional and it is the user's
   * responsibility to perform recursive state mutation that eventually
   * stabilizes (#1727).
   */
  ALLOW_RECURSE = 1 << 2,
  DISPOSED = 1 << 3,
}

export interface SchedulerJob extends IAnyFunction {
  id?: number;
  /**
   * flags can technically be undefined, but it can still be used in bitwise
   * operations just like 0.
   */
  flags?: SchedulerJobFlags;
  /**
   * Attached by renderer.ts when setting up a component's render effect
   * Used to obtain component information when reporting max recursive updates.
   */
  i?: ComponentInternalInstance;
}

export type SchedulerJobs = SchedulerJob | SchedulerJob[];

let isFlushing = false;
let isFlushPending = false;

const queue: SchedulerJob[] = [];
let flushIndex = 0;

let pendingPostCbs: SchedulerJob[] = [];

const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>;
let currentFlushPromise: Promise<void> | null = null;

const RECURSION_LIMIT = 100;
type CountMap = Map<SchedulerJob, number>;

const getJobId = (job: SchedulerJob): number =>
  job.id == null
    ? job.flags! & SchedulerJobFlags.PRE
      ? -1
      : Infinity
    : job.id;

export function nextTick<T = void, R = void>(
  this: T,
  fn?: (this: T) => R,
): Promise<Awaited<R>> {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(this ? fn.bind(this) : fn) : p;
}

export function queueJob(job: SchedulerJob): void {
  if (job.flags! & SchedulerJobFlags.QUEUED) {
    return;
  }
  const jobId = getJobId(job);
  const lastJob = queue[queue.length - 1];
  if (
    !lastJob ||
    // fast path when the job id is larger than the tail
    (!(job.flags! & SchedulerJobFlags.PRE) && jobId >= getJobId(lastJob))
  ) {
    queue.push(job);
  } else {
    queue.splice(findInsertionIndex(jobId), 0, job);
  }
  if (!(job.flags! & SchedulerJobFlags.ALLOW_RECURSE)) {
    job.flags! |= SchedulerJobFlags.QUEUED;
  }
  queueFlush();
}

export function queuePostCb(cb: SchedulerJob): void {
  if (cb.flags! & SchedulerJobFlags.QUEUED) {
    return;
  }
  pendingPostCbs.push(cb);
  if (!(cb.flags! & SchedulerJobFlags.ALLOW_RECURSE)) {
    cb.flags! |= SchedulerJobFlags.QUEUED;
  }
  queueFlush();
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

export function flushJobs(seen?: CountMap) {
  isFlushPending = false;
  isFlushing = true;

  if (__DEV__ && !seen) {
    seen = new Map();
  }

  // conditional usage of checkRecursiveUpdate must be determined out of
  // try ... catch block since Rollup by default de-optimizes treeshaking
  // inside try-catch. This can leave all warning code unshaked. Although
  // they would get eventually shaken by a minifier like terser, some minifiers
  // would fail to do that (e.g. https://github.com/evanw/esbuild/issues/1610)
  const check = __DEV__
    ? (job: SchedulerJob) => checkRecursiveUpdates(seen!, job)
    : NOOP;

  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job) {
        if (__DEV__ && check(job)) {
          continue;
        }
        callWithErrorHandling(
          job,
          job.i,
          job.i ? 'component update' : 'scheduler flush',
        );
        job.flags! &= ~SchedulerJobFlags.QUEUED;
      }
    }

    // some postFlushCb queued jobs!
    // keep flushing until it drains.
    if (pendingPostCbs.length) {
      const activePostCbs = pendingPostCbs;
      pendingPostCbs = [];

      return new Promise<void>((resolve) => {
        wx.nextTick(() => {
          flushPostCbs(activePostCbs, seen!);
          resolve();
        });
      });
    }
  } finally {
    flushIndex = 0;
    queue.length = 0;

    isFlushing = false;
    currentFlushPromise = null;
  }
}

function flushPostCbs(cbs: SchedulerJob[], seen: CountMap): void {
  const normalized = Array.from(new Set(cbs)).sort(
    (a, b) => getJobId(a) - getJobId(b),
  );
  for (const job of normalized) {
    if (__DEV__ && checkRecursiveUpdates(seen!, job)) {
      continue;
    }
    callWithErrorHandling(job, job.i, 'scheduler post flush');
    job.flags! &= ~SchedulerJobFlags.QUEUED;
  }
}

// Use binary-search to find a suitable position in the queue. The queue needs
// to be sorted in increasing order of the job ids. This ensures that:
// 1. Components are updated from parent to child. As the parent is always
//    created before the child it will always have a smaller id.
// 2. If a component is unmounted during a parent component's update, its update
//    can be skipped.
// A pre watcher will have the same id as its component's update job. The
// watcher should be inserted immediately before the update job. This allows
// watchers to be skipped if the component is unmounted by the parent update.
function findInsertionIndex(id: number) {
  let start = isFlushing ? flushIndex + 1 : 0;
  let end = queue.length;

  while (start < end) {
    const middle = (start + end) >>> 1;
    const middleJob = queue[middle];
    const middleJobId = getJobId(middleJob);
    if (
      middleJobId < id ||
      (middleJobId === id && middleJob.flags! & SchedulerJobFlags.PRE)
    ) {
      start = middle + 1;
    } else {
      end = middle;
    }
  }

  return start;
}

function checkRecursiveUpdates(seen: CountMap, fn: SchedulerJob) {
  if (!seen.has(fn)) {
    seen.set(fn, 1);
  } else {
    const count = seen.get(fn)!;
    if (count > RECURSION_LIMIT) {
      handleError(
        `Maximum recursive updates exceeded. ` +
          `This means you have a reactive effect that is mutating its own ` +
          `dependencies and thus recursively triggering itself. Possible sources ` +
          `include component template, render function, updated hook or ` +
          `watcher source function.`,
        fn.i,
        'app error handler',
      );
      return true;
    } else {
      seen.set(fn, count + 1);
    }
  }
}
