type QueuedRun = { gameId: string; run: () => Promise<void> };
type RuntimeState = { active: Map<string, Promise<void>>; queue: QueuedRun[] };

declare global {
  var __sentinel_runtime__: RuntimeState | undefined;
}

function getState(): RuntimeState {
  globalThis.__sentinel_runtime__ ??= { active: new Map(), queue: [] };
  return globalThis.__sentinel_runtime__;
}

function concurrency(): number {
  const parsed = Number(process.env.SENTINEL_MAX_CONCURRENT_RUNS ?? 2);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(8, Math.floor(parsed))) : 2;
}

function drain(): void {
  const state = getState();
  while (state.active.size < concurrency() && state.queue.length > 0) {
    const queued = state.queue.shift()!;
    const promise = queued.run();
    state.active.set(queued.gameId, promise);
    void promise.catch(() => undefined).finally(() => {
      state.active.delete(queued.gameId);
      drain();
    });
  }
}

export function enqueueRun(gameId: string, run: () => Promise<void>): void {
  const state = getState();
  if (state.active.has(gameId) || state.queue.some((item) => item.gameId === gameId)) return;
  state.queue.push({ gameId, run });
  drain();
}

export function isRunActive(gameId: string): boolean {
  return getState().active.has(gameId);
}

export function runtimeStats(): { active: number; queued: number; concurrency: number } {
  const state = getState();
  return { active: state.active.size, queued: state.queue.length, concurrency: concurrency() };
}
