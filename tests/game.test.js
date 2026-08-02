import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_STAGE_COUNTS,
  SESSION_MODE_COUNTS,
  SESSION_DIFFICULTY_COUNTS,
  cardDetails,
  createSession,
  formatActualPercent,
  formatCard,
  formatCards,
} from "../src/game.js";
import { loadQuestionBank } from "./question-fixtures.js";

const bank = loadQuestionBank();

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 2 ** 32;
  };
}

test("10問を固定ステージ比率で重複なく選ぶ", () => {
  const session = createSession(bank, seededRandom(42));

  assert.equal(session.length, 10);
  assert.equal(new Set(session.map((question) => question.id)).size, 10);
  for (const [stage, count] of Object.entries(SESSION_STAGE_COUNTS)) {
    assert.equal(
      session.filter((question) => question.stage === stage).length,
      count,
    );
  }
  for (const [mode, count] of Object.entries(SESSION_MODE_COUNTS)) {
    assert.equal(session.filter((question) => question.mode === mode).length, count);
  }
  for (const [difficulty, count] of Object.entries(SESSION_DIFFICULTY_COUNTS)) {
    assert.equal(session.filter((question) => question.difficulty === difficulty).length, count);
  }
  assert.ok(session.filter((question) => question.trueP === 0).length <= 1);
});

test("モードAのフロップとターンはカテゴリを重複させない", () => {
  for (let seed = 0; seed < 20; seed += 1) {
    const session = createSession(bank, seededRandom(seed));
    for (const stage of ["flop", "turn"]) {
      const categories = session
        .filter((question) => question.mode === "A" && question.stage === stage)
        .map((question) => question.category);
      assert.equal(new Set(categories).size, categories.length);
    }
  }
});

test("モードAの5問はカテゴリを重複させない", () => {
  for (let seed = 0; seed < 20; seed += 1) {
    const session = createSession(bank, seededRandom(seed));
    const categories = session.filter((question) => question.mode === "A").map((question) => question.category);
    assert.equal(new Set(categories).size, 5);
  }
});

test("Bを手札型・数値型1問ずつ、Cを1問、Dを別系統から2問含む", () => {
  for (let seed = 0; seed < 20; seed += 1) {
    const session = createSession(bank, seededRandom(seed));
    const comparisons = session.filter((question) => question.mode === "B");
    assert.equal(comparisons.length, 2);
    assert.equal(comparisons.filter((question) => question.answerType === "hand").length, 1);
    assert.equal(comparisons.filter((question) => question.answerType === "percent").length, 1);
    assert.equal(session.filter((question) => question.mode === "C").length, 1);
    assert.equal(session.filter((question) => question.mode === "D").length, 2);
  }
});

test("カードを本番と同じスート先頭表記にする", () => {
  assert.equal(formatCard("Ah"), "♥A");
  assert.equal(formatCards(["Ah", "Ts"]), "♥A ♠10");
});

test("カード表示に色と読み上げ用の情報を持たせる", () => {
  assert.deepEqual(cardDetails("Ah"), {
    rank: "A",
    suit: "h",
    symbol: "♥",
    suitName: "ハート",
    tone: "red",
    ariaLabel: "ハートのA",
  });
  assert.deepEqual(cardDetails("Ts"), {
    rank: "10",
    suit: "s",
    symbol: "♠",
    suitName: "スペード",
    tone: "black",
    ariaLabel: "スペードの10",
  });
});

test("回答後の確率を小数1桁で表示する", () => {
  assert.equal(formatActualPercent(31.45), "31.5%");
  assert.equal(formatActualPercent(34.97), "35.0%");
  assert.equal(formatActualPercent(6.4), "6.4%");
});
