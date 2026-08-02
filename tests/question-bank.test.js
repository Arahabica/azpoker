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

test("問題バンクは20,000問で、計画どおりのモード構成を持つ", () => {
  assert.equal(bank.length, 20_000);
  assert.equal(new Set(bank.map((question) => question.id)).size, 20_000);
  assert.equal(new Set(bank.map((question) => question.conceptKey)).size, 20_000);
  assert.deepEqual(
    Object.fromEntries(
      ["A", "B", "C", "D"].map((mode) => [
        mode,
        bank.filter((question) => question.mode === mode).length,
      ]),
    ),
    { A: 10_000, B: 4800, C: 1200, D: 4000 },
  );
});

test("100問単位のJSONとmanifestを生成する", () => {
  assert.equal(manifest.total, 20_000);
  assert.equal(manifest.batchSize, 100);
  assert.match(manifest.version, /^[a-f0-9]{12}$/);
  for (const [group, details] of Object.entries(manifest.groups)) {
    const files = fs
      .readdirSync(path.join(questionsRoot, details.path))
      .filter((filename) => filename.endsWith(".json"));
    assert.equal(files.length, details.files);
    files.sort().forEach((filename, index) => {
      const chunk = JSON.parse(
        fs.readFileSync(path.join(questionsRoot, details.path, filename), "utf8"),
      );
      assert.equal(chunk.length, 100, `${group}/${filename}`);
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
    runner_straight: 400,
    runner_flush: 350,
    runner_flush_or_straight: 300,
    board_pair: 300,
    board_two_pair: 250,
    overcard: 350,
    four_flush_board: 300,
    straight_threat_board: 300,
    pocket_pair_counterfeit: 300,
    two_pair_counterfeit: 250,
    same_hand_category: 200,
    next_card_strong_draw: 300,
    nut_flush: 400,
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
    assert.ok(["hand", "percent"].includes(question.answerType));
    if (question.answerType === "percent") {
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
  assert.match(runner?.explain ?? "", /残り2枚が両方/);
});

test("モードDは2人・6人、全13ランクと追加カテゴリを含む", () => {
  const questions = bank.filter((question) => question.mode === "D");
  assert.deepEqual(new Set(questions.map((question) => question.playerCount)), new Set([2, 6]));
  assert.deepEqual(
    new Set(questions.filter((question) => question.category === "opponent_rank").map((question) => question.targetRank)),
    new Set("23456789TJQKA"),
  );
  for (const category of [
    "opponent_pocket_pair", "opponent_overpair", "opponent_set", "opponent_top_pair_plus",
    "opponent_two_pair", "opponent_straight", "opponent_flush", "opponent_oesd",
    "opponent_gutshot", "opponent_flush_draw", "opponent_combo_draw", "opponent_higher_flush",
    "opponent_same_pair_higher_kicker", "all_opponents_miss_board",
    "exactly_one_opponent_target_rank", "multiple_opponents_target_rank",
  ]) {
    assert.ok(questions.some((question) => question.category === category), category);
  }
});

test("B+Cパックは従来B 50問・数値B 30問・C 20問", () => {
  for (const filename of fs.readdirSync(path.join(questionsRoot, "bc")).filter((name) => name.endsWith(".json"))) {
    const chunk = JSON.parse(fs.readFileSync(path.join(questionsRoot, "bc", filename), "utf8"));
    assert.equal(chunk.filter((question) => question.mode === "B" && question.answerType === "hand").length, 50);
    assert.equal(chunk.filter((question) => question.mode === "B" && question.answerType === "percent").length, 30);
    assert.equal(chunk.filter((question) => question.mode === "C").length, 20);
  }
});
