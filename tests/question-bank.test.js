"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const bank = require("../src/question-bank.js");
const {
  calculateProbability,
  isTargetComplete,
} = require("../src/probability-engine.js");

function choicePercent(value) {
  assert.match(value, /^\d+%$/);
  return Number.parseInt(value, 10);
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
        "rank_hit",
        "rank_trips",
      ].map((category) => [
        category,
        bank.filter(
          (question) =>
            question.stage === stage && question.category === category,
        ).length,
      ]),
    );
    assert.deepEqual(counts, {
      flush_draw: 7,
      oesd: 7,
      gutshot: 7,
      combo_gutshot: 7,
      combo_oesd: 7,
      rank_hit: 5,
      rank_trips: 5,
    });
  }
});

test("全問の実際の値がJS確率エンジンの再計算結果と一致する", () => {
  for (const question of bank) {
    const knownCards = [...question.hole, ...question.board];
    assert.equal(
      new Set(knownCards).size,
      knownCards.length,
      `${question.id}: カード重複`,
    );
    assert.equal(
      isTargetComplete(
        question.hole,
        question.board,
        question.target,
        question.targetRank,
      ),
      false,
      `${question.id}: 出題時点ですでに完成`,
    );

    const result = calculateProbability(question);
    assert.equal(
      result.percent.toFixed(2),
      question.trueP.toFixed(2),
      `${question.id}: 実際の値`,
    );
  }
});

test("正解は最寄りの5%刻みで、誤答より実際の値に近い", () => {
  for (const question of bank) {
    const answer = choicePercent(question.answer);
    const distractor = choicePercent(question.distractor);

    assert.equal(answer % 5, 0, `${question.id}: 5%刻み`);
    assert.equal(answer, Math.floor((question.trueP + 2.5) / 5) * 5);
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

test("特定ランク問題は手札をペアにできるランクだけを問う", () => {
  for (const question of bank.filter(
    (candidate) => candidate.category === "rank_hit",
  )) {
    assert.equal(
      question.hole.filter((card) => card[0] === question.targetRank).length,
      1,
      `${question.id}: 対象ランクの手札枚数`,
    );
    assert.equal(
      question.board.some((card) => card[0] === question.targetRank),
      false,
      `${question.id}: 対象ランクがすでにボードにある`,
    );
    assert.equal(
      question.prompt.startsWith(
        `${question.targetRank === "T" ? "10" : question.targetRank}が`,
      ),
      true,
      `${question.id}: 対象ランクの表示`,
    );
  }
});

test("問題文と解説は短く、内部の計算作業を見せない", () => {
  const bannedCopy = [
    "リバーまでに",
    "厳密値",
    "実際は約",
    "全組合せ",
    "全列挙",
  ];

  for (const question of bank) {
    assert.ok(question.prompt.endsWith("確率は？"), `${question.id}: 問題文`);
    assert.equal(question.prompt.includes("完成"), false, `${question.id}: 完成`);
    assert.equal(question.prompt.includes("Tが"), false, `${question.id}: 10表記`);
    assert.equal(question.prompt.includes("Tの"), false, `${question.id}: 10表記`);
    for (const phrase of bannedCopy) {
      assert.equal(
        `${question.prompt}${question.explain}`.includes(phrase),
        false,
        `${question.id}: ${phrase}`,
      );
    }
  }
});
