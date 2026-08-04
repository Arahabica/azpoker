const LOADING_INDICATOR_DELAY_MS = 350;
const LOADING_INDICATOR_MIN_VISIBLE_MS = 600;

interface LoadingTimingOptions {
  delayMs?: number;
  minimumVisibleMs?: number;
  now?: () => number;
  wait?: (durationMs: number) => Promise<void>;
}

function defaultNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function defaultWait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

async function waitLoadingAnimation<T>(
  load: () => Promise<T>,
  {
    delayMs = LOADING_INDICATOR_DELAY_MS,
    minimumVisibleMs = LOADING_INDICATOR_MIN_VISIBLE_MS,
    now = defaultNow,
    wait = defaultWait,
  }: LoadingTimingOptions = {},
): Promise<T> {
  const startedAt = now();

  try {
    return await load();
  } finally {
    const elapsedMs = now() - startedAt;
    if (elapsedMs >= delayMs) {
      const remainingMs = delayMs + minimumVisibleMs - elapsedMs;
      if (remainingMs > 0) {
        await wait(remainingMs);
      }
    }
  }
}

export {
  LOADING_INDICATOR_DELAY_MS,
  LOADING_INDICATOR_MIN_VISIBLE_MS,
  waitLoadingAnimation,
};
export type { LoadingTimingOptions };
