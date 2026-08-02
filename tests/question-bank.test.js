import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadQuestionBank, root } from "./question-fixtures.js";

const bank = loadQuestionBank();
const questionsRoot = path.join(root, "public", "questions");
const manifest = JSON.parse(
  fs.readFileSync(path.join(questionsRoot, "manifest.json"), "utf8"),
);

function choicePercent(value) {
  assert.match(value, /^\d+(?:\.5)?%$/);
  return Number.parseFloat(value);
}

test("問題バンクは10,000問で、計画どおりのモード構成を持つ", () => {
  assert.equal(bank.length, 10_000);
  assert.equal(new Set(bank.map((question) => question.id)).size, 10_000);
  assert.equal(new Set(bank.map((question) => question.conceptKey)).size, 10_000);
  assert.deepEqual(
    Object.fromEntries(
      ["A", "B", "C", "D"].map((mode) => [
        mode,
        bank.filter((question) => question.mode === mode).length,
      ]),
    ),
    { A: 6000, B: 3000, C: 338, D: 662 },
  );
});

test("100問単位のJSONとmanifestを生成する", () => {
  assert.equal(manifest.total, 10_000);
  assert.equal(manifest.batchSize, 100);
  assert.match(manifest.version, /^[a-f0-9]{12}$/);
  for (const [mode, details] of Object.entries(manifest.modes)) {
    const files = fs
      .readdirSync(path.join(questionsRoot, mode.toLowerCase()))
      .filter((filename) => filename.endsWith(".json"));
    assert.equal(files.length, details.files);
    files.sort().forEach((filename, index) => {
      const chunk = JSON.parse(
        fs.readFileSync(path.join(questionsRoot, mode.toLowerCase(), filename), "utf8"),
      );
      if (index < files.length - 1) assert.equal(chunk.length, 100);
      else assert.equal(chunk.length, details.count - index * 100);
    });
  }
});

test("モードAのカテゴリ数とストレートフラッシュ100問を固定する", () => {
  const expected = {
    flush: 1400,
    straight: 1600,
    flush_or_straight: 800,
    rank_hit: 550,
    rank_trips: 500,
    two_pair: 400,
    full_house: 400,
    four_kind: 250,
    straight_flush: 100,
  };
  const actual = Object.fromEntries(
    Object.keys(expected).map((category) => [
      category,
      bank.filter((question) => question.mode === "A" && question.category === category).length,
    ]),
  );
  assert.deepEqual(actual, expected);
});

test("全問のカード、選択肢、誤答理由が有効", () => {
  for (const question of bank) {
    const cards = [
      ...(question.hole ?? []),
      ...question.board,
      ...(question.hands ?? []).flat(),
    ];
    assert.equal(new Set(cards).size, cards.length, `${question.id}: カード重複`);
    assert.ok(question.distractorModel, `${question.id}: 誤答理由`);
    assert.ok(["medium", "hard"].includes(question.difficulty));
    if (question.mode !== "B") {
      assert.notEqual(question.answer, question.distractor, `${question.id}: 選択肢重複`);
      choicePercent(question.answer);
      choicePercent(question.distractor);
    }
  }
});

test("A5sの2人勝率は捨て選択肢を使わない", () => {
  const question = bank.find(
    (candidate) => candidate.mode === "C" && candidate.conceptKey === "A5s:2",
  );
  assert.ok(question);
  assert.equal(question.answer, "60%");
  assert.equal(question.distractor, "45%");
});

test("初心者向け文言を使い、内部表記を画面へ出さない", () => {
  for (const question of bank) {
    const copy = `${question.prompt}${question.explain}`;
    assert.equal(copy.includes("3カード"), false, `${question.id}: 3カード`);
    assert.equal(copy.includes("Tが"), false, `${question.id}: T表記`);
    assert.equal(copy.includes("Tの"), false, `${question.id}: T表記`);
    assert.equal(copy.includes("厳密値"), false, `${question.id}: 内部表現`);
    assert.equal(copy.includes("全列挙"), false, `${question.id}: 内部表現`);
  }
  const runner = bank.find((question) => question.explain.includes("ランナーランナー"));
  assert.match(runner?.explain ?? "", /残り2枚が両方そろって完成する形/);
});

test("モードDは2人・6人、全13ランクを含む", () => {
  const questions = bank.filter((question) => question.mode === "D");
  assert.deepEqual(new Set(questions.map((question) => question.playerCount)), new Set([2, 6]));
  assert.deepEqual(new Set(questions.map((question) => question.targetRank)), new Set("23456789TJQKA"));
});
