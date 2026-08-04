import assert from "node:assert/strict";
import test from "node:test";

import {
  getCountdownSnapshot,
  getQuestionTimeLimitMs,
  startQuestionCountdown,
} from "../src/question-timer.ts";

function createFakeScheduler() {
  let now = 0;
  let nextId = 1;
  const frames = new Map();
  const expirations = new Map();

  return {
    scheduler: {
      now: () => now,
      requestFrame(callback) {
        const id = nextId;
        nextId += 1;
        frames.set(id, callback);
        return id;
      },
      cancelFrame(id) {
        frames.delete(id);
      },
      setExpiration(callback) {
        const id = nextId;
        nextId += 1;
        expirations.set(id, callback);
        return id;
      },
      clearExpiration(id) {
        expirations.delete(id);
      },
    },
    setNow(value) {
      now = value;
    },
    runFrame() {
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback(now);
    },
    runExpiration() {
      const entry = expirations.entries().next().value;
      if (!entry) return;
      const [id, callback] = entry;
      expirations.delete(id);
      callback();
    },
    pendingCount() {
      return frames.size + expirations.size;
    },
  };
}

test("問題の種類から5秒・8秒・12秒・16秒を割り当てる", () => {
  assert.equal(
    getQuestionTimeLimitMs({
      mode: "A",
      difficulty: "medium",
      stage: "preflop",
    }),
    5_000,
  );
  assert.equal(
    getQuestionTimeLimitMs({ mode: "D", difficulty: "medium", stage: "flop" }),
    8_000,
  );
  assert.equal(
    getQuestionTimeLimitMs({ mode: "C", difficulty: "medium", stage: "turn" }),
    12_000,
  );
  assert.equal(
    getQuestionTimeLimitMs({ mode: "A", difficulty: "hard", stage: "preflop" }),
    16_000,
  );
  assert.equal(
    getQuestionTimeLimitMs({
      mode: "B",
      difficulty: "medium",
      stage: "preflop",
    }),
    16_000,
  );
});

test("残り時間を表示秒数・割合・警告状態へ変換する", () => {
  assert.deepEqual(getCountdownSnapshot(5_000, 5_000), {
    remainingMs: 5_000,
    elapsedProgress: 0,
    seconds: 5,
    warning: "normal",
    expired: false,
  });
  assert.equal(getCountdownSnapshot(5_000, 3_001).warning, "normal");
  assert.equal(getCountdownSnapshot(5_000, 3_000).warning, "warning");
  assert.equal(getCountdownSnapshot(5_000, 1_501).warning, "warning");
  assert.equal(getCountdownSnapshot(5_000, 1_500).warning, "critical");
  assert.equal(getCountdownSnapshot(5_000, 1).seconds, 1);
  assert.deepEqual(getCountdownSnapshot(5_000, 0), {
    remainingMs: 0,
    elapsedProgress: 1,
    seconds: 0,
    warning: "expired",
    expired: true,
  });
});

test("終了時刻を基準に更新し、期限で一度だけ時間切れにする", () => {
  const fake = createFakeScheduler();
  const updates = [];
  let expirationCount = 0;

  startQuestionCountdown({
    durationMs: 3_000,
    onUpdate: (remainingMs) => updates.push(remainingMs),
    onExpire: () => {
      expirationCount += 1;
    },
    scheduler: fake.scheduler,
  });

  assert.deepEqual(updates, [3_000]);
  fake.setNow(1_250);
  fake.runFrame();
  assert.equal(updates.at(-1), 1_750);

  fake.setNow(3_000);
  fake.runExpiration();
  fake.runFrame();
  assert.equal(updates.at(-1), 0);
  assert.equal(expirationCount, 1);
  assert.equal(fake.pendingCount(), 0);
});

test("回答時に停止すると期限を過ぎても時間切れにしない", () => {
  const fake = createFakeScheduler();
  let expirationCount = 0;
  const stop = startQuestionCountdown({
    durationMs: 5_000,
    onUpdate() {},
    onExpire: () => {
      expirationCount += 1;
    },
    scheduler: fake.scheduler,
  });

  stop();
  fake.setNow(8_000);
  fake.runFrame();
  fake.runExpiration();
  assert.equal(expirationCount, 0);
  assert.equal(fake.pendingCount(), 0);
});

test("残り2秒に入ったときだけ音声警告を一度通知する", () => {
  const fake = createFakeScheduler();
  let warningCount = 0;
  const stop = startQuestionCountdown({
    durationMs: 8_000,
    onUpdate() {},
    onWarning: () => {
      warningCount += 1;
    },
    onExpire() {},
    scheduler: fake.scheduler,
  });

  fake.setNow(5_999);
  fake.runFrame();
  assert.equal(warningCount, 0);

  fake.setNow(6_000);
  fake.runFrame();
  assert.equal(warningCount, 1);

  fake.setNow(7_000);
  fake.runFrame();
  assert.equal(warningCount, 1);
  stop();
});
