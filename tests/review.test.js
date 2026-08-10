import assert from "node:assert/strict";
import test from "node:test";

import { createQuizHistoryEntry } from "../src/result-history.ts";
import {
  RECENT_HISTORY_REVIEW_LIMIT,
  REVIEW_COMPLETION_MESSAGES,
  addRecentMistakeToSession,
  createReviewSession,
  formatDifficulty,
  getReviewCompletionMessage,
  recentWrongAnswers,
} from "../src/review.ts";

function question(id) {
  return {
    id,
    mode: "A",
    stage: "flop",
    hole: ["Ah", "Kh"],
    board: ["Qh", "2c", "7d"],
    category: "flush",
    prompt: "フラッシュの確率は？",
    explain: "同じマークが5枚そろう可能性です。",
    difficulty: "medium",
    conceptKey: `review:${id}`,
    trueP: 34.97,
    distractorModel: "残り枚数を混同する",
    level: "beginner",
    answerType: "percent",
    answer: "35%",
    distractor: "20%",
  };
}

function historyEntry(index, outcome = "wrong") {
  const source = question(`question-${index}`);
  return createQuizHistoryEntry(
    {
      id: `history-${index}`,
      score: outcome === "correct" ? 1 : 0,
      total: 1,
      elapsedMs: 1_000,
      timeLimitMs: 5_000,
      timeoutCount: outcome === "timeout" ? 1 : 0,
      answers: [
        {
          question: source,
          outcome,
          selected:
            outcome === "timeout"
              ? null
              : outcome === "correct"
                ? "35%"
                : "20%",
        },
      ],
    },
    1_800_000_000_000 - index,
  );
}

test("直近10セットの誤答だけを通常セットへランダムに1問追加する", () => {
  const history = Array.from(
    { length: RECENT_HISTORY_REVIEW_LIMIT + 1 },
    (_, index) => historyEntry(index),
  );
  const base = [question("base-question")];
  const session = addRecentMistakeToSession(base, history, () => 0.999);

  assert.equal(recentWrongAnswers(history).length, 10);
  assert.equal(session.length, 2);
  assert.equal(session[1].id, "question-9");
  assert.equal(
    session.some((item) => item.id === "question-10"),
    false,
  );
});

test("通常セットと同じ問題は履歴から重複追加しない", () => {
  const duplicated = question("question-0");
  assert.deepEqual(
    addRecentMistakeToSession([duplicated], [historyEntry(0)], () => 0),
    [duplicated],
  );
});

test("復習開始時は誤答と時間切れだけを問題IDごとに1件取り出す", () => {
  const wrong = historyEntry(1).answers[0];
  const timeout = historyEntry(2, "timeout").answers[0];
  const correct = historyEntry(3, "correct").answers[0];

  assert.deepEqual(
    createReviewSession([wrong, wrong, timeout, correct, null]).map(
      (item) => item.id,
    ),
    ["question-1", "question-2"],
  );
});

test("復習完了メッセージを複数用意し、難易度を日本語表示する", () => {
  assert.ok(REVIEW_COMPLETION_MESSAGES.length >= 10);
  assert.equal(
    getReviewCompletionMessage(() => 0),
    "復習お疲れ様でした！",
  );
  assert.equal(
    getReviewCompletionMessage(() => 0.999),
    "迷った問題も、もう大丈夫！",
  );
  assert.equal(formatDifficulty("medium"), "ふつう");
  assert.equal(formatDifficulty("hard"), "むずかしい");
});
