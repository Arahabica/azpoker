import assert from "node:assert/strict";
import test from "node:test";

import { createQuizHistoryEntry } from "../src/result-history.ts";
import {
  RECENT_HISTORY_REVIEW_LIMIT,
  REVIEW_COMPLETION_MESSAGES,
  completeReviewHistoryEntry,
  createReviewSession,
  formatDifficulty,
  getRecentMistakeQuestion,
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

test("直近10セットの誤答だけから通常セットへ含める1問を選ぶ", () => {
  const history = Array.from(
    { length: RECENT_HISTORY_REVIEW_LIMIT + 1 },
    (_, index) => historyEntry(index),
  );
  const picked = getRecentMistakeQuestion(history, () => 0.999);

  assert.equal(recentWrongAnswers(history).length, 10);
  assert.equal(picked?.id, "question-9");
  assert.notEqual(picked?.id, "question-10");
});

test("誤答または時間切れがなければ履歴問題を選ばない", () => {
  assert.equal(getRecentMistakeQuestion([historyEntry(0, "correct")]), null);
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

test("復習完了時は元の正誤を保ち、復習分の時間だけ履歴へ加える", () => {
  const original = historyEntry(1);
  const completedAt = 1_900_000_000_000;
  const completed = completeReviewHistoryEntry(
    original,
    2_500,
    10_000,
    completedAt,
  );

  assert.equal(completed.completedAt, completedAt);
  assert.equal(completed.elapsedMs, 3_500);
  assert.equal(completed.timeLimitMs, 15_000);
  assert.equal(completed.score, original.score);
  assert.equal(completed.timeoutCount, original.timeoutCount);
  assert.deepEqual(completed.answers, original.answers);
  assert.equal(original.elapsedMs, 1_000);
  assert.equal(original.timeLimitMs, 5_000);
});

test("復習完了メッセージを複数用意し、難易度を日本語表示する", () => {
  assert.equal(REVIEW_COMPLETION_MESSAGES.length, 12);
  assert.deepEqual(
    getReviewCompletionMessage(() => 0),
    ["復習", "お疲れ様でした！"],
  );
  assert.deepEqual(REVIEW_COMPLETION_MESSAGES[1], [
    "復習完了！",
    "また一歩",
    "強くなりました！",
  ]);
  assert.deepEqual(
    getReviewCompletionMessage(() => 0.999),
    ["迷った問題も、", "もう大丈夫！"],
  );
  assert.equal(formatDifficulty("medium"), "ふつう");
  assert.equal(formatDifficulty("hard"), "むずかしい");
});
