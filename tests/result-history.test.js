import assert from "node:assert/strict";
import test from "node:test";

import {
  RESULT_HISTORY_KEY,
  RESULT_HISTORY_LIMIT,
  RESULT_HISTORY_VERSION,
  createQuizHistoryEntry,
  formatRelativeHistoryTime,
  parseQuizHistory,
  readQuizHistory,
  saveQuizHistory,
} from "../src/result-history.ts";

const question = {
  id: "a-history-1",
  mode: "A",
  stage: "flop",
  hole: ["Ah", "Kh"],
  board: ["Qh", "2c", "7d"],
  category: "flush",
  prompt: "フラッシュの確率は？",
  explain: "同じマークが5枚そろう可能性です。",
  difficulty: "medium",
  conceptKey: "history-fixture",
  trueP: 34.97,
  distractorModel: "残り枚数を混同する",
  level: "beginner",
  answerType: "percent",
  answer: "35%",
  distractor: "20%",
};

function createMemoryStorage(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) {
    values.set(RESULT_HISTORY_KEY, initialValue);
  }
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function result(id, overrides = {}) {
  return createQuizHistoryEntry(
    {
      id,
      score: 8,
      total: 10,
      elapsedMs: 44_500,
      timeLimitMs: 95_000,
      timeoutCount: 1,
      ...overrides,
    },
    1_700_000_000_000 + Number(id.replace(/\D/g, "") || 0),
  );
}

test("保存値がない場合や壊れている場合は空の履歴として扱う", () => {
  assert.deepEqual(parseQuizHistory(null), []);
  assert.deepEqual(parseQuizHistory("not-json"), []);
  assert.deepEqual(parseQuizHistory("{}"), []);

  const valid = result("result-1");
  assert.deepEqual(
    parseQuizHistory(JSON.stringify([valid, { ...valid, id: "" }, null])),
    [valid],
  );
});

test("完了日時を現在からの経過時間で簡潔に表示する", () => {
  const now = 1_800_000_000_000;

  assert.equal(formatRelativeHistoryTime(now - 30_000, now), "たった今");
  assert.equal(formatRelativeHistoryTime(now - 5 * 60_000, now), "5分前");
  assert.equal(
    formatRelativeHistoryTime(now - 5 * 60 * 60_000, now),
    "5時間前",
  );
  assert.equal(
    formatRelativeHistoryTime(now - 5 * 24 * 60 * 60_000, now),
    "5日前",
  );
  assert.equal(
    formatRelativeHistoryTime(now - 31 * 24 * 60 * 60_000, now),
    "31日前",
  );
  assert.equal(formatRelativeHistoryTime(now + 60_000, now), "たった今");
});

test("結果を新しい順で最大50件保存する", () => {
  const storage = createMemoryStorage();
  let history = [];
  for (let index = 1; index <= RESULT_HISTORY_LIMIT + 2; index += 1) {
    history = saveQuizHistory(result(`result-${index}`), storage);
  }

  assert.equal(history.length, RESULT_HISTORY_LIMIT);
  assert.equal(history[0].id, "result-52");
  assert.equal(history.at(-1).id, "result-3");
  assert.deepEqual(readQuizHistory(storage), history);
});

test("同じセッションIDは新しい結果へ置き換えて重複させない", () => {
  const storage = createMemoryStorage();
  saveQuizHistory(result("result-1"), storage);
  const updated = result("result-1", { score: 9, timeoutCount: 0 });
  const history = saveQuizHistory(updated, storage);

  assert.equal(history.length, 1);
  assert.equal(history[0].score, 9);
});

test("LocalStorageの読み書きに失敗しても結果表示用の履歴を返す", () => {
  const unavailableStorage = {
    getItem() {
      throw new Error("unavailable");
    },
    setItem() {
      throw new Error("unavailable");
    },
  };
  const entry = result("result-1");

  assert.deepEqual(readQuizHistory(unavailableStorage), []);
  assert.deepEqual(saveQuizHistory(entry, unavailableStorage), [entry]);
});

test("不正な結果は保存用レコードにしない", () => {
  assert.throws(
    () =>
      createQuizHistoryEntry({
        id: "result-invalid",
        score: 11,
        total: 10,
        elapsedMs: 10_000,
        timeLimitMs: 95_000,
        timeoutCount: 0,
      }),
    /保存できないクイズ結果/,
  );
});

test("各問題・選択回答・正誤を問題スナップショットと一緒に保存する", () => {
  const entry = createQuizHistoryEntry(
    {
      id: "result-with-answers",
      score: 0,
      total: 1,
      elapsedMs: 1_500,
      timeLimitMs: 5_000,
      timeoutCount: 0,
      answers: [
        {
          question,
          outcome: "wrong",
          selected: "20%",
        },
      ],
    },
    1_800_000_000_000,
  );

  assert.equal(entry.version, RESULT_HISTORY_VERSION);
  assert.deepEqual(parseQuizHistory(JSON.stringify([entry])), [entry]);
  assert.equal(entry.answers[0].question.difficulty, "medium");
  assert.equal(entry.answers[0].selected, "20%");
});

test("旧形式の履歴は概要を残したまま問題記録なしへ移行する", () => {
  const legacy = {
    version: 1,
    id: "legacy-result",
    completedAt: 1_700_000_000_000,
    score: 8,
    total: 10,
    elapsedMs: 44_500,
    timeLimitMs: 95_000,
    timeoutCount: 1,
  };

  assert.deepEqual(parseQuizHistory(JSON.stringify([legacy])), [
    { ...legacy, version: RESULT_HISTORY_VERSION, answers: [] },
  ]);
});

test("回答記録の件数や正答数が概要と食い違う履歴は拒否する", () => {
  assert.throws(
    () =>
      createQuizHistoryEntry({
        id: "mismatched-answers",
        score: 1,
        total: 1,
        elapsedMs: 1_500,
        timeLimitMs: 5_000,
        timeoutCount: 0,
        answers: [
          {
            question,
            outcome: "wrong",
            selected: "20%",
          },
        ],
      }),
    /保存できないクイズ結果/,
  );
});
