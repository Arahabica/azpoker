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

function minimumChoiceGap(answer) {
  if (answer === 0) return 3;
  if (answer <= 3) return 2;
  if (answer < 20) return 5;
  return 10;
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
    runner_straight: 700,
    runner_flush: 650,
    runner_flush_or_straight: 350,
    board_pair: 350,
    board_two_pair: 300,
    overcard: 400,
    four_flush_board: 350,
    pocket_pair_counterfeit: 350,
    two_pair_counterfeit: 300,
    same_hand_category: 250,
  };
  const actual = Object.fromEntries(
    Object.keys(expected).map((category) => [
      category,
      bank.filter((question) => question.mode === "A" && question.category === category).length,
    ]),
  );
  assert.deepEqual(actual, expected);
  assert.equal(bank.some((question) => question.category === "straight_threat_board"), false);
  assert.equal(bank.some((question) => question.category === "next_card_strong_draw"), false);
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
      assert.notEqual(question.answer, "2.5%", `${question.id}: 旧2.5%正解`);
      assert.notEqual(question.distractor, "2.5%", `${question.id}: 旧2.5%誤答`);
      const answer = choicePercent(question.answer);
      const distractor = choicePercent(question.distractor);
      if (answer === 2) {
        assert.ok(distractor >= 5, `${question.id}: 2%の誤答が近すぎる`);
      }
      assert.ok(
        Math.abs(answer - distractor) >= minimumChoiceGap(answer),
        `${question.id}: 選択肢が近すぎる`,
      );
    }
  }
});

test("1.9%前後は約2%とし、隣接する1%・3%を誤答にしない", () => {
  const questions = bank.filter(
    (question) => question.answer === "2%" && question.trueP >= 1.85 && question.trueP <= 1.95,
  );

  assert.ok(questions.length > 0);
  for (const question of questions) {
    assert.ok(choicePercent(question.distractor) >= 5, question.id);
  }
});

test("ナッツフラッシュと同じ役の種類を問うカテゴリを出題しない", () => {
  assert.equal(
    bank.some((question) => ["nut_flush", "same_final_category"].includes(question.category)),
    false,
  );
  assert.equal(
    bank.some((question) => question.prompt.includes("最高のフラッシュ")),
    false,
  );
});

test("手札のペアより高いカードは具体的な数字と残り枚数で尋ねる", () => {
  const ranks = [..."23456789TJQKA"];
  const overcardQuestions = bank.filter((question) => question.category === "overcard");

  assert.equal(overcardQuestions.length, 400);
  for (const question of overcardQuestions) {
    const pairRank = question.hole[0][0];
    assert.equal(question.hole[1][0], pairRank, `${question.id}: 手札がペアでない`);
    const nextRank = ranks[ranks.indexOf(pairRank) + 1];
    const displayedRank = nextRank === "T" ? "10" : nextRank;
    const condition = nextRank === "A" ? "A" : `${displayedRank}以上`;
    const subject = question.stage === "turn" ? "次のカード" : "残り2枚のどちらか";

    assert.equal(question.prompt, `${subject}が${condition}の確率は？`, question.id);
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
  const explanationOnlyTerms = [
    "クリーンアウト",
    "ポケットペア",
    "オーバーペア",
    "セット",
    "トップペア",
    "OESD",
    "ガットショット",
    "フラッシュドロー",
    "コンボドロー",
    "キッカー",
  ];
  for (const question of bank) {
    const copy = `${question.prompt}${question.explain}`;
    assert.equal(copy.includes("3カード"), false, `${question.id}: 3カード`);
    assert.equal(copy.includes("Tが"), false, `${question.id}: T表記`);
    assert.equal(copy.includes("Tの"), false, `${question.id}: T表記`);
    assert.equal(copy.includes("厳密値"), false, `${question.id}: 内部表現`);
    assert.equal(copy.includes("全列挙"), false, `${question.id}: 内部表現`);
    assert.equal(copy.includes("スート"), false, `${question.id}: 初心者向け表現`);
    assert.equal(copy.includes("ランク"), false, `${question.id}: 初心者向け表現`);
    for (const term of explanationOnlyTerms) {
      assert.equal(question.prompt.includes(term), false, `${question.id}: ${term}`);
    }
    if (question.mode === "D") {
      assert.ok(
        question.prompt.startsWith(`${question.playerCount}人卓で`),
        `${question.id}: 卓人数`,
      );
    }
  }
  const runner = bank.find((question) => question.explain.includes("ランナーランナー"));
  assert.match(runner?.explain ?? "", /残り2枚が両方/);

  const cleanOut = bank.find((question) => question.category === "clean_out");
  assert.match(cleanOut?.prompt ?? "", /最後の1枚で逆転する/);
  assert.match(cleanOut?.explain ?? "", /クリーンアウト/);

  const opponentSet = bank.find((question) => question.category === "opponent_set");
  assert.match(opponentSet?.prompt ?? "", /手札のペアでスリー/);
  assert.match(opponentSet?.explain ?? "", /セット/);

  const opponentOesd = bank.find((question) => question.category === "opponent_oesd");
  assert.match(opponentOesd?.prompt ?? "", /ストレートの両端待ち/);
  assert.match(opponentOesd?.explain ?? "", /OESD/);
});

test("ボード4枚問題は対象のマークを具体的に示す", () => {
  const suitNames = {
    c: "クラブ",
    d: "ダイヤ",
    h: "ハート",
    s: "スペード",
  };
  const questions = bank.filter(
    (question) => question.category === "four_flush_board",
  );

  assert.equal(questions.length, 350);
  assert.deepEqual(
    new Set(questions.map((question) => question.targetSuit)),
    new Set(Object.keys(suitNames)),
  );
  for (const question of questions) {
    const suitName = suitNames[question.targetSuit];
    assert.ok(suitName, `${question.id}: 対象マーク`);
    assert.equal(
      question.prompt,
      `ボードに${suitName}が4枚になる確率は？`,
      question.id,
    );
    assert.match(question.explain, new RegExp(suitName), question.id);
  }
});

test("モードBの数値問題を勝敗に関係する7形式へ振り分ける", () => {
  const expected = {
    tie_probability: 300,
    trailing_hand_wins: 300,
    clean_out: 225,
    next_card_reversal: 225,
    board_straight_chop: 225,
    board_flush_chop: 225,
    leading_hand_holds: 300,
  };
  const numericModeB = bank.filter(
    (question) => question.mode === "B" && question.answerType === "percent",
  );
  assert.equal(numericModeB.length, 1_800);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(expected).map((category) => [
        category,
        numericModeB.filter((question) => question.category === category).length,
      ]),
    ),
    expected,
  );

  const nextCardReversals = numericModeB.filter(
    (question) => question.category === "next_card_reversal",
  );
  for (const question of nextCardReversals) {
    assert.equal(question.stage, "flop");
    assert.equal(question.prompt, "次のカードで役の強さが逆転する確率は？");
  }

  assert.equal(
    numericModeB.some((question) => question.category === "same_final_category"),
    false,
  );

  for (const question of numericModeB.filter(
    (candidate) => candidate.category === "board_straight_chop",
  )) {
    assert.equal(
      question.prompt,
      "ボードの5枚だけでストレートになり、引き分ける確率は？",
    );
  }

  for (const question of numericModeB.filter(
    (candidate) => ["trailing_hand_wins", "leading_hand_holds"].includes(candidate.category),
  )) {
    assert.ok([0, 1].includes(question.targetHand), `${question.id}: 対象手札`);
    const side = question.targetHand === 0 ? "左" : "右";
    assert.equal(question.prompt, `${side}の手札の勝率は？`);
  }
});

test("手札比較は現在の役ではなく最終的な勝率を尋ねる", () => {
  const comparisons = bank.filter(
    (question) => question.category === "hand_comparison",
  );
  assert.equal(comparisons.length, 3000);
  for (const question of comparisons) {
    assert.equal(question.prompt, "勝率が高いのは？");
  }
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


  const rankValues = Object.fromEntries(
    [..."23456789TJQKA"].map((rank, index) => [rank, index]),
  );
  for (const question of questions.filter(
    (candidate) => candidate.category === "opponent_top_pair_plus",
  )) {
    const topRank = question.board.reduce(
      (highest, card) =>
        rankValues[card[0]] > rankValues[highest] ? card[0] : highest,
      question.board[0][0],
    );
    const displayedRank = topRank === "T" ? "10" : topRank;
    const subject = question.playerCount === 2 ? "相手" : "ほかの誰か";
    assert.equal(
      question.prompt,
      `${question.playerCount}人卓で${subject}が${displayedRank}を持つ確率は？`,
    );
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
