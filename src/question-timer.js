const STAGE_TIME_LIMITS_MS = Object.freeze({
  preflop: 5_000,
  flop: 8_000,
  turn: 12_000,
});

const HARD_TIME_LIMIT_MS = 16_000;
const WARNING_THRESHOLD_MS = 3_000;
const CRITICAL_THRESHOLD_MS = 1_500;

function getTimerWarning(remainingMs) {
  if (remainingMs <= 0) return "expired";
  if (remainingMs <= CRITICAL_THRESHOLD_MS) return "critical";
  if (remainingMs <= WARNING_THRESHOLD_MS) return "warning";
  return "normal";
}

function getQuestionTimeLimitMs(question) {
  if (!question || typeof question !== "object") {
    throw new TypeError("問題がありません");
  }

  if (question.mode === "B" || question.difficulty === "hard") {
    return HARD_TIME_LIMIT_MS;
  }

  if (question.difficulty !== "medium") {
    throw new TypeError(`不正な難易度です: ${String(question.difficulty)}`);
  }

  const durationMs = STAGE_TIME_LIMITS_MS[question.stage];
  if (!durationMs) {
    throw new TypeError(`不正なステージです: ${String(question.stage)}`);
  }

  return durationMs;
}

function getCountdownSnapshot(durationMs, remainingMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new TypeError(`不正な制限時間です: ${String(durationMs)}`);
  }
  if (!Number.isFinite(remainingMs)) {
    throw new TypeError(`不正な残り時間です: ${String(remainingMs)}`);
  }

  const clampedRemainingMs = Math.min(
    durationMs,
    Math.max(0, remainingMs),
  );

  return Object.freeze({
    remainingMs: clampedRemainingMs,
    elapsedProgress: 1 - clampedRemainingMs / durationMs,
    seconds: Math.ceil(clampedRemainingMs / 1_000),
    warning: getTimerWarning(clampedRemainingMs),
    expired: clampedRemainingMs === 0,
  });
}

function browserScheduler() {
  return {
    now: () => globalThis.performance.now(),
    requestFrame: (callback) => globalThis.requestAnimationFrame(callback),
    cancelFrame: (id) => globalThis.cancelAnimationFrame(id),
    setExpiration: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
    clearExpiration: (id) => globalThis.clearTimeout(id),
  };
}

function startQuestionCountdown({
  durationMs,
  onUpdate,
  onExpire,
  scheduler = browserScheduler(),
}) {
  getCountdownSnapshot(durationMs, durationMs);
  if (typeof onUpdate !== "function" || typeof onExpire !== "function") {
    throw new TypeError("タイマーのコールバックがありません");
  }

  const deadline = scheduler.now() + durationMs;
  let animationFrameId = 0;
  let expirationTimerId = 0;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    scheduler.cancelFrame(animationFrameId);
    scheduler.clearExpiration(expirationTimerId);
  };

  const finish = () => {
    if (stopped) return;
    onUpdate(0);
    stop();
    onExpire();
  };

  const expireWhenDue = () => {
    if (stopped) return;
    const remainingMs = deadline - scheduler.now();
    if (remainingMs > 0) {
      expirationTimerId = scheduler.setExpiration(
        expireWhenDue,
        remainingMs,
      );
      return;
    }
    finish();
  };

  const update = () => {
    if (stopped) return;
    const remainingMs = Math.max(0, deadline - scheduler.now());
    if (remainingMs === 0) {
      finish();
      return;
    }
    onUpdate(remainingMs);
    animationFrameId = scheduler.requestFrame(update);
  };

  onUpdate(durationMs);
  animationFrameId = scheduler.requestFrame(update);
  expirationTimerId = scheduler.setExpiration(expireWhenDue, durationMs);

  return stop;
}

export {
  CRITICAL_THRESHOLD_MS,
  HARD_TIME_LIMIT_MS,
  STAGE_TIME_LIMITS_MS,
  WARNING_THRESHOLD_MS,
  getCountdownSnapshot,
  getQuestionTimeLimitMs,
  startQuestionCountdown,
};
