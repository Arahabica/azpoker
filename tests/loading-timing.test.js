import assert from "node:assert/strict";
import test from "node:test";

import {
  LOADING_INDICATOR_DELAY_MS,
  LOADING_INDICATOR_MIN_VISIBLE_MS,
  waitLoadingAnimation,
} from "../src/loading-timing.ts";

function createTimingHarness(completedAtMs) {
  let nowCallCount = 0;
  const waits = [];

  return {
    now() {
      nowCallCount += 1;
      return nowCallCount === 1 ? 0 : completedAtMs;
    },
    async wait(durationMs) {
      waits.push(durationMs);
    },
    waits,
  };
}

test("350ms未満で読み込めた場合はローディング表示を待たない", async () => {
  const timing = createTimingHarness(349);
  let loadStarted = false;

  const value = await waitLoadingAnimation(async () => {
    loadStarted = true;
    return "ready";
  }, timing);

  assert.equal(loadStarted, true);
  assert.equal(value, "ready");
  assert.deepEqual(timing.waits, []);
});

test("表示したローディングは最低600ms維持する", async () => {
  const timing = createTimingHarness(500);

  await waitLoadingAnimation(async () => undefined, timing);

  assert.deepEqual(timing.waits, [
    LOADING_INDICATOR_DELAY_MS + LOADING_INDICATOR_MIN_VISIBLE_MS - 500,
  ]);
});

test("最低表示時間を過ぎていれば追加で待たない", async () => {
  const timing = createTimingHarness(1_100);

  await waitLoadingAnimation(async () => undefined, timing);

  assert.deepEqual(timing.waits, []);
});

test("読み込み失敗時も表示済みローディングを急に消さない", async () => {
  const timing = createTimingHarness(400);
  const failure = new Error("load failed");

  await assert.rejects(
    waitLoadingAnimation(async () => {
      throw failure;
    }, timing),
    failure,
  );
  assert.deepEqual(timing.waits, [550]);
});
