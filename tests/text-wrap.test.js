import assert from "node:assert/strict";
import test from "node:test";

import {
  PERFECT_RESULT_MESSAGES,
  getResultSummary,
} from "../src/result-summary.ts";
import {
  splitAtNaturalBreaks,
  splitResultMessageAtNaturalBreaks,
} from "../src/text-wrap.ts";
import { loadQuestionBank } from "./question-fixtures.js";

const bank = loadQuestionBank();

test("問題文を意味のまとまりへ分け、変な位置で改行させない", () => {
  for (const question of bank) {
    const phrases = splitAtNaturalBreaks(question.prompt);
    assert.equal(
      phrases.join(""),
      question.prompt,
      `${question.id}: 本文を維持`,
    );
    for (const phrase of phrases) {
      assert.ok(
        [...phrase].length <= 14,
        `${question.id}: 長すぎるまとまり「${phrase}」`,
      );
    }
  }
});

test("卓人数・対象・条件の間を改行候補にする", () => {
  assert.deepEqual(
    splitAtNaturalBreaks(
      "6人卓でほかの誰かがストレートとフラッシュ待ちの確率は？",
    ),
    ["6人卓で", "ほかの誰かが", "ストレートと", "フラッシュ待ちの確率は？"],
  );
  assert.deepEqual(splitAtNaturalBreaks("Jがスリーになる確率は？"), [
    "Jがスリーになる確率は？",
  ]);
  assert.deepEqual(splitAtNaturalBreaks("残り2枚のどちらかが3以上の確率は？"), [
    "残り2枚のどちらかが",
    "3以上の確率は？",
  ]);
  assert.deepEqual(splitAtNaturalBreaks("次のカードが10以上の確率は？"), [
    "次のカードが",
    "10以上の確率は？",
  ]);
  assert.deepEqual(
    splitAtNaturalBreaks("リバーまでにフラッシュができる確率は？"),
    ["リバーまでに", "フラッシュができる確率は？"],
  );
});

test("ゲーム終了メッセージを意味のまとまりでだけ折り返す", () => {
  const resultInputs = [
    { score: 10, elapsedMs: 1_000 },
    { score: 10, elapsedMs: 9_000 },
    { score: 9, elapsedMs: 1_000 },
    { score: 9, elapsedMs: 9_000 },
    { score: 8, elapsedMs: 9_000 },
    { score: 6, elapsedMs: 9_000 },
    { score: 4, elapsedMs: 9_000 },
    { score: 3, elapsedMs: 9_000 },
  ];
  const resultMessages = [
    ...PERFECT_RESULT_MESSAGES,
    ...resultInputs.map(
      ({ score, elapsedMs }) =>
        getResultSummary({
          score,
          total: 10,
          elapsedMs,
          timeLimitMs: 10_000,
          timeoutCount: 0,
        }).headline,
    ),
  ];

  for (const message of resultMessages) {
    const phrases = splitResultMessageAtNaturalBreaks(message);
    assert.equal(phrases.join(""), message);
    for (const phrase of phrases) {
      assert.ok([...phrase].length <= 10, `長すぎるまとまり「${phrase}」`);
    }
  }

  assert.deepEqual(
    splitResultMessageAtNaturalBreaks("速い！パーフェクトまであと1問！"),
    ["速い！", "パーフェクトまで", "あと1問！"],
  );
  assert.deepEqual(
    splitResultMessageAtNaturalBreaks("いい調子！迷った問題を振り返ろう！"),
    ["いい調子！", "迷った問題を", "振り返ろう！"],
  );
  assert.deepEqual(
    splitResultMessageAtNaturalBreaks("惜しい！パーフェクトはもう目前！"),
    ["惜しい！", "パーフェクトは", "もう目前！"],
  );
  assert.deepEqual(
    splitResultMessageAtNaturalBreaks("君こそポーカーキングだ！"),
    ["君こそ", "ポーカーキングだ！"],
  );
});
