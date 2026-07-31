"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateProbability,
  hasFlushUsingHole,
  hasStraightUsingHole,
} = require("../src/probability-engine.js");

function assertRoundsTo(actual, expected, digits = 1) {
  assert.equal(actual.toFixed(digits), expected.toFixed(digits));
}

test("仕様§4の6つの検算値を全列挙で再現する", async (t) => {
  await t.test("スーテッド2枚 → フラッシュ: 6.4%", () => {
    const result = calculateProbability({
      hole: ["Ah", "Kh"],
      board: [],
      target: "flush",
    });

    assert.equal(result.total, 2_118_760);
    assertRoundsTo(result.percent, 6.4);
  });

  await t.test("フロップ フラッシュドロー: 35.0%", () => {
    const result = calculateProbability({
      hole: ["Ah", "Kh"],
      board: ["2h", "9h", "Jd"],
      target: "flush",
    });

    assert.equal(result.total, 1_081);
    assertRoundsTo(result.percent, 35.0);
  });

  await t.test("フロップ OESD: 31.5%", () => {
    const result = calculateProbability({
      hole: ["9s", "Jd"],
      board: ["6c", "7h", "8d"],
      target: "straight",
    });

    assert.equal(result.total, 1_081);
    assertRoundsTo(result.percent, 31.5);
  });

  await t.test("フロップ ガットショット: 17.9%", () => {
    const result = calculateProbability({
      hole: ["8s", "9d"],
      board: ["6c", "Th", "Kd"],
      target: "straight",
    });

    assert.equal(result.total, 1_081);
    assertRoundsTo(result.percent, 17.9);
  });

  await t.test("ターン フラッシュドロー: 19.6%", () => {
    const result = calculateProbability({
      hole: ["Ah", "Kh"],
      board: ["2h", "9h", "Jd", "4c"],
      target: "flush",
    });

    assert.equal(result.total, 46);
    assertRoundsTo(result.percent, 19.6);
  });

  await t.test("ターン ガットショット: 8.7%", () => {
    const result = calculateProbability({
      hole: ["8s", "9d"],
      board: ["6c", "Th", "Kd", "2h"],
      target: "straight",
    });

    assert.equal(result.total, 46);
    assertRoundsTo(result.percent, 8.7);
  });
});

test("Aをローとして扱い、A2345をストレートと判定する", () => {
  assert.equal(
    hasStraightUsingHole(["Ah", "Kd"], ["2c", "3d", "4s", "5h", "9c"]),
    true,
  );
});

test("ボードだけで完成した役は数えない", () => {
  assert.equal(
    hasFlushUsingHole(["As", "Kd"], ["2h", "4h", "6h", "8h", "Th"]),
    false,
  );
  assert.equal(
    hasStraightUsingHole(["Qs", "Kd"], ["2c", "3d", "4s", "5h", "6c"]),
    false,
  );
});

test("重複カードを拒否する", () => {
  assert.throws(
    () =>
      calculateProbability({
        hole: ["Ah", "Ah"],
        board: [],
        target: "flush",
      }),
    /同じカード/,
  );
});
