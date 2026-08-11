import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialGameFlow,
  getAnswerResult,
  getPreparationError,
  getQuestionIndex,
  transitionGameFlow,
} from "../src/game-flow.ts";

function prepareGame(totalQuestions = 10) {
  let state = createInitialGameFlow();
  state = transitionGameFlow(state, { type: "START_PREPARATION" });
  state = transitionGameFlow(state, {
    type: "PREPARATION_SUCCEEDED",
    totalQuestions,
  });
  return transitionGameFlow(state, { type: "START_SESSION" });
}

test("トップから準備完了を経た場合だけ出題を開始する", () => {
  const top = createInitialGameFlow();
  const invalidStart = transitionGameFlow(top, {
    type: "START_SESSION",
  });
  assert.strictEqual(invalidStart, top);

  const preparing = transitionGameFlow(top, { type: "START_PREPARATION" });
  const ready = transitionGameFlow(preparing, {
    type: "PREPARATION_SUCCEEDED",
    totalQuestions: 10,
  });
  const answering = transitionGameFlow(ready, {
    type: "START_SESSION",
  });

  assert.deepEqual(preparing, { status: "preparing" });
  assert.deepEqual(ready, { status: "ready", totalQuestions: 10 });
  assert.deepEqual(answering, {
    status: "answering",
    questionIndex: 0,
    totalQuestions: 10,
  });
  assert.equal(getQuestionIndex(answering), 0);
});

test("準備失敗を独立状態にし、そこから再試行できる", () => {
  const preparing = transitionGameFlow(createInitialGameFlow(), {
    type: "START_PREPARATION",
  });
  const failed = transitionGameFlow(preparing, {
    type: "PREPARATION_FAILED",
    message: "問題を読み込めませんでした",
  });

  assert.equal(getPreparationError(failed), "問題を読み込めませんでした");
  assert.deepEqual(transitionGameFlow(failed, { type: "START_PREPARATION" }), {
    status: "preparing",
  });
});

test("回答は出題中の同じ問題に対して一度だけ受け付ける", () => {
  const answering = prepareGame();
  const staleAnswer = transitionGameFlow(answering, {
    type: "ANSWER",
    questionIndex: 1,
    correct: true,
    selected: "40%",
  });
  assert.strictEqual(staleAnswer, answering);

  const answered = transitionGameFlow(answering, {
    type: "ANSWER",
    questionIndex: 0,
    correct: true,
    selected: "40%",
  });
  assert.deepEqual(getAnswerResult(answered), {
    correct: true,
    selected: "40%",
    timedOut: false,
  });

  const duplicateAnswer = transitionGameFlow(answered, {
    type: "ANSWER",
    questionIndex: 0,
    correct: false,
    selected: "30%",
  });
  assert.strictEqual(duplicateAnswer, answered);
});

test("時間切れは対象問題が一致するときだけ回答済みにする", () => {
  const answering = prepareGame();
  assert.strictEqual(
    transitionGameFlow(answering, { type: "TIMEOUT", questionIndex: 1 }),
    answering,
  );

  const timedOut = transitionGameFlow(answering, {
    type: "TIMEOUT",
    questionIndex: 0,
  });
  assert.deepEqual(getAnswerResult(timedOut), {
    correct: false,
    selected: null,
    timedOut: true,
  });
});

test("回答後だけ次の問題へ進み、最終問題の後は結果にする", () => {
  const firstQuestion = prepareGame(2);
  assert.strictEqual(
    transitionGameFlow(firstQuestion, {
      type: "NEXT_QUESTION",
    }),
    firstQuestion,
  );

  const firstAnswer = transitionGameFlow(firstQuestion, {
    type: "ANSWER",
    questionIndex: 0,
    correct: false,
    selected: 1,
  });
  const secondQuestion = transitionGameFlow(firstAnswer, {
    type: "NEXT_QUESTION",
  });
  assert.deepEqual(secondQuestion, {
    status: "answering",
    questionIndex: 1,
    totalQuestions: 2,
  });

  const secondAnswer = transitionGameFlow(secondQuestion, {
    type: "ANSWER",
    questionIndex: 1,
    correct: true,
    selected: 0,
  });
  assert.deepEqual(
    transitionGameFlow(secondAnswer, {
      type: "NEXT_QUESTION",
    }),
    { status: "result", totalQuestions: 2 },
  );
});

test("復習中の誤答はキュー末尾へ戻し、正解するまで結果に進まない", () => {
  let result = prepareGame(1);
  result = transitionGameFlow(result, {
    type: "ANSWER",
    questionIndex: 0,
    correct: false,
    selected: "20%",
  });
  result = transitionGameFlow(result, { type: "NEXT_QUESTION" });

  let review = transitionGameFlow(result, {
    type: "START_REVIEW",
    totalQuestions: 2,
  });
  review = transitionGameFlow(review, {
    type: "ANSWER",
    questionIndex: 0,
    correct: false,
    selected: "20%",
  });
  review = transitionGameFlow(review, {
    type: "NEXT_QUESTION",
    repeatCurrent: true,
  });
  assert.deepEqual(review, {
    status: "answering",
    questionIndex: 1,
    totalQuestions: 3,
  });

  review = transitionGameFlow(review, {
    type: "ANSWER",
    questionIndex: 1,
    correct: true,
    selected: "35%",
  });
  review = transitionGameFlow(review, { type: "NEXT_QUESTION" });
  assert.deepEqual(review, {
    status: "answering",
    questionIndex: 2,
    totalQuestions: 3,
  });

  review = transitionGameFlow(review, {
    type: "ANSWER",
    questionIndex: 2,
    correct: true,
    selected: "35%",
  });
  assert.deepEqual(transitionGameFlow(review, { type: "NEXT_QUESTION" }), {
    status: "result",
    totalQuestions: 3,
  });
});

test("離脱するとどの進行状態からでもトップへ戻る", () => {
  const answered = transitionGameFlow(prepareGame(), {
    type: "TIMEOUT",
    questionIndex: 0,
  });
  assert.deepEqual(transitionGameFlow(answered, { type: "LEAVE" }), {
    status: "top",
  });

  const preparing = transitionGameFlow(createInitialGameFlow(), {
    type: "START_PREPARATION",
  });
  const leftDuringPreparation = transitionGameFlow(preparing, {
    type: "LEAVE",
  });
  assert.strictEqual(
    transitionGameFlow(leftDuringPreparation, {
      type: "PREPARATION_SUCCEEDED",
      totalQuestions: 10,
    }),
    leftDuringPreparation,
  );
});
