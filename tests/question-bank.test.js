"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const bank = require("../src/question-bank.js");
const {
  calculateProbability,
  isTargetComplete,
} = require("../src/probability-engine.js");

function fractionPercent(value) {
  const [numerator, denominator] = value.split("/").map(Number);
  return (numerator / denominator) * 100;
}

test("問題バンクは100問で、ステージとカテゴリの構成が固定されている", () => {
  assert.equal(bank.length, 100);
  assert.equal(new Set(bank.map((question) => question.id)).size, 100);

  const stageCounts = Object.fromEntries(
    ["preflop", "flop", "turn"].map((stage) => [
      stage,
      bank.filter((question) => question.stage === stage).length,
    ]),
  );
  assert.deepEqual(stageCounts, { preflop: 10, flop: 45, turn: 45 });

  for (const stage of ["flop", "turn"]) {
    const counts = Object.fromEntries(
      [
        "flush_draw",
        "oesd",
        "gutshot",
        "combo_gutshot",
        "combo_oesd",
      ].map((category) => [
        category,
        bank.filter(
          (question) =>
            question.stage === stage && question.category === category,
        ).length,
      ]),
    );
    assert.deepEqual(counts, {
      flush_draw: 9,
      oesd: 9,
      gutshot: 9,
      combo_gutshot: 9,
      combo_oesd: 9,
    });
  }
});

test("全問の厳密値がJS確率エンジンの再計算結果と一致する", () => {
  for (const question of bank) {
    const knownCards = [...question.hole, ...question.board];
    assert.equal(
      new Set(knownCards).size,
      knownCards.length,
      `${question.id}: カード重複`,
    );
    assert.equal(
      isTargetComplete(question.hole, question.board, question.target),
      false,
      `${question.id}: 出題時点ですでに完成`,
    );

    const result = calculateProbability(question);
    assert.equal(
      result.percent.toFixed(2),
      question.trueP.toFixed(2),
      `${question.id}: 厳密値`,
    );
  }
});

test("正解ラベルは誤答より厳密値に近く、選択肢は1.3倍以上離れている", () => {
  for (const question of bank) {
    const answer = fractionPercent(question.answer);
    const distractor = fractionPercent(question.distractor);

    assert.ok(
      Math.abs(question.trueP - answer) < Math.abs(question.trueP - distractor),
      `${question.id}: 正解と誤答の距離`,
    );
    assert.ok(
      Math.max(answer, distractor) / Math.min(answer, distractor) >= 1.3,
      `${question.id}: 選択肢の倍率`,
    );
  }
});
