import assert from "node:assert/strict";
import test from "node:test";

import {
  formatElapsedTime,
  formatTimeLimit,
  getResultSummary,
} from "../src/result-summary.js";

test("回答に使った時間を0.1秒単位で表示する", () => {
  assert.equal(formatElapsedTime(44_450), "44.5秒");
  assert.equal(formatElapsedTime(32_500), "32.5秒");
  assert.equal(formatTimeLimit(55_000), "55秒");
});

test("8問正解の結果を正答数と速さに合わせて表示する", () => {
  assert.deepEqual(
    getResultSummary({
      score: 8,
      total: 10,
      elapsedMs: 44_500,
      timeLimitMs: 55_000,
      timeoutCount: 1,
    }),
    {
      headline: "惜しい！もう少し！",
      scoreLabel: "8問正解",
      totalLabel: "10問中",
      elapsedLabel: "44.5秒",
      limitLabel: "制限時間: 55秒",
      timeoutLabel: "時間切れ: 1問",
      perfect: false,
      fast: false,
    },
  );
});

test("速い全問正解を特別な結果として扱う", () => {
  assert.deepEqual(
    getResultSummary({
      score: 10,
      total: 10,
      elapsedMs: 32_500,
      timeLimitMs: 55_000,
      timeoutCount: 0,
    }),
    {
      headline: "天才！君こそポーカーキングだ！",
      scoreLabel: "10問全問正解",
      totalLabel: "10問中",
      elapsedLabel: "32.5秒",
      limitLabel: "制限時間: 55秒",
      timeoutLabel: "時間切れ: 0問",
      perfect: true,
      fast: true,
    },
  );
});

test("同じ正答数でも回答速度で文言を変える", () => {
  const fast = getResultSummary({
    score: 6,
    total: 10,
    elapsedMs: 30_000,
    timeLimitMs: 100_000,
    timeoutCount: 2,
  });
  const steady = getResultSummary({
    score: 6,
    total: 10,
    elapsedMs: 80_000,
    timeLimitMs: 100_000,
    timeoutCount: 2,
  });

  assert.notEqual(fast.headline, steady.headline);
  assert.equal(fast.fast, true);
  assert.equal(steady.fast, false);
});
