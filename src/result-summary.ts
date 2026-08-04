const FAST_RESULT_RATIO = 0.65;

interface ResultInput {
  score: number;
  total: number;
  elapsedMs: number;
  timeLimitMs: number;
  timeoutCount: number;
}

interface ResultSummary {
  headline: string;
  scoreLabel: string;
  totalLabel: string;
  elapsedLabel: string;
  limitLabel: string;
  timeoutLabel: string | null;
  perfect: boolean;
  fast: boolean;
}

function validateResult({
  score,
  total,
  elapsedMs,
  timeLimitMs,
  timeoutCount,
}: ResultInput): void {
  if (!Number.isInteger(total) || total <= 0) {
    throw new TypeError(`不正な問題数です: ${String(total)}`);
  }
  if (!Number.isInteger(score) || score < 0 || score > total) {
    throw new TypeError(`不正な正解数です: ${String(score)}`);
  }
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new TypeError(`不正な回答時間です: ${String(elapsedMs)}`);
  }
  if (!Number.isFinite(timeLimitMs) || timeLimitMs <= 0) {
    throw new TypeError(`不正な制限時間です: ${String(timeLimitMs)}`);
  }
  if (
    !Number.isInteger(timeoutCount) ||
    timeoutCount < 0 ||
    timeoutCount > total - score
  ) {
    throw new TypeError(`不正な時間切れ数です: ${String(timeoutCount)}`);
  }
}

function formatElapsedTime(elapsedMs: number): string {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new TypeError(`不正な回答時間です: ${String(elapsedMs)}`);
  }

  const seconds = Math.round(elapsedMs / 100) / 10;
  return `${seconds.toFixed(1)}秒`;
}

function formatTimeLimit(timeLimitMs: number): string {
  if (!Number.isFinite(timeLimitMs) || timeLimitMs <= 0) {
    throw new TypeError(`不正な制限時間です: ${String(timeLimitMs)}`);
  }

  return `${Math.round(timeLimitMs / 1_000)}秒`;
}

function getHeadline({
  score,
  total,
  fast,
  timeoutCount,
}: Pick<ResultInput, "score" | "total" | "timeoutCount"> & {
  fast: boolean;
}): string {
  const canPraiseSpeed = fast && timeoutCount === 0;

  if (score === total) {
    return canPraiseSpeed
      ? "天才！君こそポーカーキングだ！"
      : "完璧！一問も逃さない！";
  }
  if (score === total - 1) {
    return canPraiseSpeed
      ? "速い！パーフェクトまであと1問！"
      : "惜しい！パーフェクトはもう目前！";
  }

  const accuracy = score / total;
  if (accuracy >= 0.8) {
    return "惜しい！もう少し！";
  }
  if (accuracy >= 0.6) {
    return "いい調子！迷った問題を振り返ろう！";
  }
  if (accuracy >= 0.4) {
    return "ここから伸びる！もう一勝負！";
  }
  return "大丈夫、ここから強くなる！";
}

function getResultSummary(result: ResultInput): Readonly<ResultSummary> {
  validateResult(result);
  const { score, total, elapsedMs, timeLimitMs, timeoutCount } = result;
  const perfect = score === total;
  const fast = elapsedMs / timeLimitMs <= FAST_RESULT_RATIO;

  return Object.freeze({
    headline: getHeadline({ score, total, fast, timeoutCount }),
    scoreLabel: perfect ? `${total}問全問正解` : `${score}問正解`,
    totalLabel: `${total}問中`,
    elapsedLabel: formatElapsedTime(elapsedMs),
    limitLabel: `制限時間: ${formatTimeLimit(timeLimitMs)}`,
    timeoutLabel: timeoutCount > 0 ? `時間切れ: ${timeoutCount}問` : null,
    perfect,
    fast,
  });
}

export {
  FAST_RESULT_RATIO,
  formatElapsedTime,
  formatTimeLimit,
  getResultSummary,
};
