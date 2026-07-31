"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const bank = require("../src/question-bank.js");
const {
  SESSION_STAGE_COUNTS,
  createSession,
  formatCard,
  formatCards,
} = require("../src/game.js");

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
});

test("フロップとターンは1セット内でカテゴリを重複させない", () => {
  for (let seed = 0; seed < 20; seed += 1) {
    const session = createSession(bank, seededRandom(seed));
    for (const stage of ["flop", "turn"]) {
      const categories = session
        .filter((question) => question.stage === stage)
        .map((question) => question.category);
      assert.equal(new Set(categories).size, categories.length);
    }
  }
});

test("カードを本番と同じスート先頭表記にする", () => {
  assert.equal(formatCard("Ah"), "♥A");
  assert.equal(formatCards(["Ah", "Ts"]), "♥A ♠T");
});
