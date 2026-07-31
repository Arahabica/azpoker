"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const bank = require("../src/question-bank.js");
const {
  SESSION_STAGE_COUNTS,
  boardRevealSteps,
  cardDetails,
  createSession,
  formatActualPercent,
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

test("各セットにランクを絞った問題を含める", () => {
  for (let seed = 0; seed < 20; seed += 1) {
    const session = createSession(bank, seededRandom(seed));
    const categories = session.map((question) => question.category);

    assert.ok(categories.includes("rank_hit"));
    assert.ok(categories.includes("rank_trips"));
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

test("ターン問題はフロップ3枚とターン1枚に分けて表示する", () => {
  assert.deepEqual(
    boardRevealSteps({
      stage: "turn",
      board: ["2h", "9h", "Jd", "4c"],
    }),
    [
      { street: "flop", cards: ["2h", "9h", "Jd"] },
      { street: "turn", cards: ["4c"] },
    ],
  );
  assert.deepEqual(boardRevealSteps({ stage: "preflop", board: [] }), []);
});

test("回答後の確率を小数1桁で表示する", () => {
  assert.equal(formatActualPercent(31.45), "31.5%");
  assert.equal(formatActualPercent(34.97), "35.0%");
  assert.equal(formatActualPercent(6.4), "6.4%");
});
