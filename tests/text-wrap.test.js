import assert from "node:assert/strict";
import test from "node:test";

import { splitAtNaturalBreaks } from "../src/text-wrap.js";
import { loadQuestionBank } from "./question-fixtures.js";

const bank = loadQuestionBank();

test("問題文を意味のまとまりへ分け、変な位置で改行させない", () => {
  for (const question of bank) {
    const phrases = splitAtNaturalBreaks(question.prompt);
    assert.equal(phrases.join(""), question.prompt, `${question.id}: 本文を維持`);
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
    splitAtNaturalBreaks("6人卓でほかの誰かがストレートとフラッシュ待ちの確率は？"),
    ["6人卓で", "ほかの誰かが", "ストレートと", "フラッシュ待ちの確率は？"],
  );
  assert.deepEqual(
    splitAtNaturalBreaks("Jがスリーになる確率は？"),
    ["Jがスリーになる確率は？"],
  );
});
