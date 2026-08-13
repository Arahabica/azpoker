import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { createSession } from "../src/game.ts";
import {
  B_HAND_COMPARISON_ARCHETYPE_COUNTS,
  QUESTION_ANSWER_TYPE_COUNTS,
  QUESTION_BATCH_SIZE,
  QUESTION_GROUP_COUNTS,
  QUESTION_MODE_COUNTS,
  QUESTION_PATTERN_COUNTS,
  QUESTION_TOTAL,
} from "../src/generated/question-patterns.ts";
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

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 2 ** 32;
  };
}

test("問題バンクは正本どおりのカテゴリ・モード構成を持つ", () => {
  assert.equal(bank.length, QUESTION_TOTAL);
  assert.equal(
    new Set(bank.map((question) => question.id)).size,
    QUESTION_TOTAL,
  );
  assert.equal(
    new Set(bank.map((question) => question.conceptKey)).size,
    QUESTION_TOTAL,
  );
  assert.deepEqual(
    Object.fromEntries(
      ["A", "B", "C", "D"].map((mode) => [
        mode,
        bank.filter((question) => question.mode === mode).length,
      ]),
    ),
    QUESTION_MODE_COUNTS,
  );
  for (const [mode, expected] of Object.entries(QUESTION_PATTERN_COUNTS)) {
    assert.deepEqual(
      Object.fromEntries(
        Object.keys(expected).map((category) => [
          category,
          bank.filter(
            (question) =>
              question.mode === mode && question.category === category,
          ).length,
        ]),
      ),
      expected,
    );
  }
});

test("100問単位のJSONとmanifestを生成する", () => {
  assert.equal(manifest.total, QUESTION_TOTAL);
  assert.equal(manifest.batchSize, QUESTION_BATCH_SIZE);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(manifest.groups).map(([group, details]) => [
        group,
        details.count,
      ]),
    ),
    QUESTION_GROUP_COUNTS,
  );
  assert.match(manifest.version, /^[a-f0-9]{12}$/);
  for (const [group, details] of Object.entries(manifest.groups)) {
    const files = fs
      .readdirSync(path.join(questionsRoot, details.path))
      .filter((filename) => filename.endsWith(".json"));
    assert.equal(files.length, details.files);
    files.sort().forEach((filename) => {
      const chunk = JSON.parse(
        fs.readFileSync(
          path.join(questionsRoot, details.path, filename),
          "utf8",
        ),
      );
      assert.equal(chunk.length, QUESTION_BATCH_SIZE, `${group}/${filename}`);
    });
  }
});

test("モードAを通常ドロー中心にし、バックドアフラッシュだけ200問残す", () => {
  const expected = QUESTION_PATTERN_COUNTS.A;
  const actual = Object.fromEntries(
    Object.keys(expected).map((category) => [
      category,
      bank.filter(
        (question) => question.mode === "A" && question.category === category,
      ).length,
    ]),
  );
  assert.deepEqual(actual, expected);
  assert.equal(
    bank.some((question) => question.category === "straight_threat_board"),
    false,
  );
  assert.equal(
    bank.some((question) => question.category === "next_card_strong_draw"),
    false,
  );
});

test("全問のカード、選択肢、誤答理由が有効", () => {
  for (const question of bank) {
    const cards = [
      ...(question.hole ?? []),
      ...question.board,
      ...(question.hands ?? []).flat(),
    ];
    assert.equal(
      new Set(cards).size,
      cards.length,
      `${question.id}: カード重複`,
    );
    assert.ok(question.distractorModel, `${question.id}: 誤答理由`);
    assert.ok(["medium", "hard"].includes(question.difficulty));
    assert.ok(
      ["beginner", "intermediate", "advanced"].includes(question.level),
      `${question.id}: 対象者レベル`,
    );
    assert.ok(["hand", "percent"].includes(question.answerType));
    assert.notEqual(question.trueP, 0, `${question.id}: 0%問題`);
    if (question.answerType === "percent") {
      assert.notEqual(
        question.answer,
        question.distractor,
        `${question.id}: 選択肢重複`,
      );
      assert.notEqual(question.answer, "2.5%", `${question.id}: 旧2.5%正解`);
      assert.notEqual(
        question.distractor,
        "2.5%",
        `${question.id}: 旧2.5%誤答`,
      );
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
    (question) =>
      question.answer === "2%" &&
      question.trueP >= 1.85 &&
      question.trueP <= 1.95,
  );

  assert.ok(questions.length > 0);
  for (const question of questions) {
    assert.ok(choicePercent(question.distractor) >= 5, question.id);
  }
});

test("ナッツフラッシュと同じ役の種類を問うカテゴリを出題しない", () => {
  assert.equal(
    bank.some((question) =>
      ["nut_flush", "same_final_category"].includes(question.category),
    ),
    false,
  );
  assert.equal(
    bank.some((question) => question.prompt.includes("最高のフラッシュ")),
    false,
  );
});

test("手札のペアより高いカードは具体的な数字と残り枚数で尋ねる", () => {
  const ranks = [..."23456789TJQKA"];
  const overcardQuestions = bank.filter(
    (question) => question.category === "overcard",
  );

  assert.equal(overcardQuestions.length, QUESTION_PATTERN_COUNTS.A.overcard);
  for (const question of overcardQuestions) {
    const pairRank = question.hole[0][0];
    assert.equal(
      question.hole[1][0],
      pairRank,
      `${question.id}: 手札がペアでない`,
    );
    const nextRank = ranks[ranks.indexOf(pairRank) + 1];
    const displayedRank = nextRank === "T" ? "10" : nextRank;
    const condition = nextRank === "A" ? "A" : `${displayedRank}以上`;
    const subject =
      question.stage === "turn" ? "次のカード" : "残り2枚のどちらか";

    assert.equal(
      question.prompt,
      `${subject}が${condition}の確率は？`,
      question.id,
    );
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

test("6人卓は危険ボード4カテゴリだけ中級者へ出題する", () => {
  const multiway = bank.filter((question) => question.playerCount === 6);
  const boardThreatCategories = new Set([
    "opponent_straight_three_connected_board",
    "opponent_straight_four_connected_board",
    "opponent_flush_three_suited_board",
    "opponent_flush_four_suited_board",
  ]);
  assert.ok(multiway.length > 0);
  assert.ok(
    multiway.every((question) =>
      boardThreatCategories.has(question.category)
        ? question.level === "intermediate"
        : question.level === "advanced",
    ),
  );
  assert.ok(
    bank.some(
      (question) =>
        question.mode === "C" &&
        question.playerCount === 2 &&
        question.level !== "advanced",
    ),
  );
});

test("初心者向け文言を使い、内部表記を画面へ出さない", () => {
  const explanationOnlyTerms = [
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
  const learningSignals = [
    "アウツ",
    "組合せ",
    "覚えます",
    "概算",
    "基準",
    "順で",
    "まず",
    "先に",
    "残り",
    "見えていない",
    "分けて考え",
  ];
  for (const question of bank) {
    const copy = `${question.prompt}${question.explain}`;
    assert.equal(copy.includes("3カード"), false, `${question.id}: 3カード`);
    assert.equal(copy.includes("Tが"), false, `${question.id}: T表記`);
    assert.equal(copy.includes("Tの"), false, `${question.id}: T表記`);
    assert.equal(copy.includes("厳密値"), false, `${question.id}: 内部表現`);
    assert.equal(copy.includes("全列挙"), false, `${question.id}: 内部表現`);
    assert.equal(
      copy.includes("スート"),
      false,
      `${question.id}: 初心者向け表現`,
    );
    assert.equal(
      copy.includes("ランク"),
      false,
      `${question.id}: 初心者向け表現`,
    );
    assert.equal(
      copy.includes("厳密には"),
      false,
      `${question.id}: 冗長な前置き`,
    );
    assert.ok(
      learningSignals.some((signal) => question.explain.includes(signal)),
      `${question.id}: 学習手掛かり`,
    );
    for (const term of explanationOnlyTerms) {
      assert.equal(
        question.prompt.includes(term),
        false,
        `${question.id}: ${term}`,
      );
    }
    if (question.mode === "D") {
      assert.ok(
        question.prompt.startsWith(`${question.playerCount}人卓で`),
        `${question.id}: 卓人数`,
      );
    }
  }
  assert.equal(
    bank.some((question) => question.explain.includes("ランナーランナー")),
    false,
  );

  const opponentSet = bank.find(
    (question) => question.category === "opponent_set",
  );
  assert.match(opponentSet?.prompt ?? "", /手札のペアでスリー/);
  assert.match(opponentSet?.explain ?? "", /セット/);

  const opponentOesd = bank.find(
    (question) => question.category === "opponent_oesd",
  );
  assert.match(opponentOesd?.prompt ?? "", /ストレートの両端待ち/);
  assert.match(opponentOesd?.explain ?? "", /OESD/);
});

test("回答後の解説は数え方・暗算方法・覚え方を具体的に示す", () => {
  const byId = Object.fromEntries(
    ["a-04136", "a-06565", "a-06918", "a-03171"].map((id) => [
      id,
      bank.find((question) => question.id === id),
    ]),
  );

  assert.match(byId["a-04136"]?.explain ?? "", /3枚＝3アウツ/);
  assert.match(byId["a-04136"]?.explain ?? "", /アウツ×2/);
  assert.match(byId["a-04136"]?.explain ?? "", /約6%/);

  assert.match(byId["a-06565"]?.explain ?? "", /9枚＝9アウツ/);
  assert.match(byId["a-06565"]?.explain ?? "", /アウツ×4/);
  assert.match(byId["a-06565"]?.explain ?? "", /約36%/);

  assert.match(byId["a-06918"]?.explain ?? "", /合計8アウツ/);
  assert.match(byId["a-06918"]?.explain ?? "", /アウツ×2/);
  assert.match(byId["a-06918"]?.explain ?? "", /約16%/);

  assert.match(byId["a-03171"]?.explain ?? "", /9＋4−1＝12アウツ/);
  assert.match(byId["a-03171"]?.explain ?? "", /アウツ×4/);
  assert.match(byId["a-03171"]?.explain ?? "", /少し高め/);

  assert.ok(bank.every((question) => !question.explain.includes("厳密には")));
  assert.ok(
    bank
      .filter((question) => question.mode === "C")
      .every(
        (question) =>
          !/^この(?:手札|状況)での\d人での勝率は/.test(question.explain),
      ),
  );
  assert.ok(
    bank.every(
      (question) => !/約(?:1\d\d|[2-9]\d\d)%と概算/.test(question.explain),
    ),
    "100%以上の概算を説明へ出さない",
  );
  for (const question of bank.filter(
    (candidate) =>
      candidate.category === "overcard" &&
      candidate.stage === "flop" &&
      candidate.trueP >= 80,
  )) {
    assert.match(question.explain, /外れ.*100%から引/);
  }
});

test("バックドアフラッシュは単独ドローの約4.2%だけを問う", () => {
  const questions = bank.filter(
    (question) => question.category === "backdoor_flush",
  );
  assert.equal(questions.length, QUESTION_PATTERN_COUNTS.A.backdoor_flush);

  for (const question of questions) {
    assert.equal(question.stage, "flop", question.id);
    assert.equal(question.level, "beginner", question.id);
    assert.equal(question.trueP, 4.16, question.id);
    assert.equal(question.answer, "5%", question.id);
    assert.equal(question.distractor, "35%", question.id);
    assert.equal(
      question.prompt,
      "リバーまでにフラッシュができる確率は？",
      question.id,
    );
    assert.match(question.explain, /今3枚/);
    assert.match(question.explain, /約4\.2%/);
    const cards = [...question.hole, ...question.board];
    assert.equal(
      cards.filter((card) => card[1] === question.targetSuit).length,
      3,
      question.id,
    );
    assert.ok(
      question.hole.some((card) => card[1] === question.targetSuit),
      question.id,
    );
  }

  for (const category of [
    "runner_straight",
    "runner_flush",
    "runner_flush_or_straight",
  ]) {
    assert.equal(
      bank.some((question) => question.category === category),
      false,
      category,
    );
  }
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

  assert.equal(questions.length, QUESTION_PATTERN_COUNTS.A.four_flush_board);
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

test("モードBの数値問題は実戦的な右手札の勝率2形式に絞る", () => {
  const expected = {
    trailing_hand_wins: QUESTION_PATTERN_COUNTS.B.trailing_hand_wins,
    leading_hand_holds: QUESTION_PATTERN_COUNTS.B.leading_hand_holds,
  };
  const numericModeB = bank.filter(
    (question) => question.mode === "B" && question.answerType === "percent",
  );
  assert.equal(numericModeB.length, QUESTION_ANSWER_TYPE_COUNTS.B.percent);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(expected).map((category) => [
        category,
        numericModeB.filter((question) => question.category === category)
          .length,
      ]),
    ),
    expected,
  );

  for (const removedCategory of [
    "clean_out",
    "next_card_reversal",
    "same_final_category",
    "tie_probability",
    "board_straight_chop",
    "board_flush_chop",
  ]) {
    assert.equal(
      numericModeB.some((question) => question.category === removedCategory),
      false,
    );
  }
  assert.equal(
    numericModeB.some((question) =>
      [
        "最後の1枚で逆転する確率は？",
        "次のカードで役の強さが逆転する確率は？",
      ].includes(question.prompt),
    ),
    false,
  );

  for (const question of numericModeB) {
    assert.equal(question.targetHand, 1, `${question.id}: 対象手札`);
    assert.equal(question.prompt, "右の手札の勝率は？");
    assert.ok(question.trueP >= 5 && question.trueP <= 95, question.id);
    assert.equal(question.level, "intermediate", question.id);
  }
  assert.equal(
    numericModeB.some((question) => question.prompt === "左の手札の勝率は？"),
    false,
  );
});

test("手札比較は両方に続行理由がある実戦的な類型へ寄せる", () => {
  const comparisons = bank.filter(
    (question) => question.category === "hand_comparison",
  );
  assert.equal(comparisons.length, QUESTION_PATTERN_COUNTS.B.hand_comparison);
  const expectedArchetypes = B_HAND_COMPARISON_ARCHETYPE_COUNTS;
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(expectedArchetypes).map((archetype) => [
        archetype,
        comparisons.filter((question) => question.archetype === archetype)
          .length,
      ]),
    ),
    expectedArchetypes,
  );
  for (const question of comparisons) {
    assert.equal(question.prompt, "勝率が高いのは？");
    assert.equal(question.continuationReasons.length, 2, question.id);
    assert.ok(question.continuationReasons.every((reasons) => reasons.length));
  }
});

test("モードDは2人・6人、全13ランクと追加カテゴリを含む", () => {
  const questions = bank.filter((question) => question.mode === "D");
  assert.deepEqual(
    new Set(questions.map((question) => question.playerCount)),
    new Set([2, 6]),
  );
  assert.deepEqual(
    new Set(
      questions
        .filter((question) => question.category === "opponent_rank")
        .map((question) => question.targetRank),
    ),
    new Set("23456789TJQKA"),
  );
  for (const category of Object.keys(QUESTION_PATTERN_COUNTS.D)) {
    assert.ok(
      questions.some((question) => question.category === category),
      category,
    );
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
  for (const question of questions) {
    if (
      (question.playerCount === 6 &&
        !question.category.endsWith("_connected_board") &&
        !question.category.endsWith("_suited_board")) ||
      [
        "all_opponents_miss_board",
        "exactly_one_opponent_target_rank",
        "multiple_opponents_target_rank",
      ].includes(question.category)
    ) {
      assert.equal(question.level, "advanced", question.id);
    }
  }
});

test("危険ボード4カテゴリは6人卓の完成役確率を各250問扱う", () => {
  const categories = {
    opponent_straight_three_connected_board: {
      stage: "flop",
      boardSize: 3,
      kind: "straight",
    },
    opponent_straight_four_connected_board: {
      stage: "turn",
      boardSize: 4,
      kind: "straight",
    },
    opponent_flush_three_suited_board: {
      stage: "flop",
      boardSize: 3,
      kind: "flush",
    },
    opponent_flush_four_suited_board: {
      stage: "turn",
      boardSize: 4,
      kind: "flush",
    },
  };
  const rankOrder = "A23456789TJQKA";

  for (const [category, expected] of Object.entries(categories)) {
    const questions = bank.filter((question) => question.category === category);
    assert.equal(questions.length, QUESTION_PATTERN_COUNTS.D[category]);
    assert.equal(questions.length, 250);
    for (const question of questions) {
      assert.equal(question.playerCount, 6, question.id);
      assert.equal(question.level, "intermediate", question.id);
      assert.equal(question.stage, expected.stage, question.id);
      assert.equal(question.board.length, expected.boardSize, question.id);
      assert.equal(
        question.prompt,
        `6人卓でほかの誰かが${expected.kind === "straight" ? "ストレート" : "フラッシュ"}の確率は？`,
        question.id,
      );
      if (expected.kind === "flush") {
        assert.equal(
          new Set(question.board.map((card) => card[1])).size,
          1,
          question.id,
        );
      } else {
        const ranks = question.board.map((card) => card[0]);
        assert.ok(
          [...rankOrder].some((_, index) => {
            const sequence = rankOrder.slice(index, index + expected.boardSize);
            return (
              sequence.length === expected.boardSize &&
              [...sequence].every((rank) => ranks.includes(rank))
            );
          }),
          `${question.id}: ボードが連番でない`,
        );
      }
    }
  }
});

test("B+Cパックは従来B 50問・数値B 30問・C 20問", () => {
  const fileCount = QUESTION_GROUP_COUNTS.BC / QUESTION_BATCH_SIZE;
  for (const filename of fs
    .readdirSync(path.join(questionsRoot, "bc"))
    .filter((name) => name.endsWith(".json"))) {
    const chunk = JSON.parse(
      fs.readFileSync(path.join(questionsRoot, "bc", filename), "utf8"),
    );
    assert.equal(
      chunk.filter(
        (question) => question.mode === "B" && question.answerType === "hand",
      ).length,
      QUESTION_ANSWER_TYPE_COUNTS.B.hand / fileCount,
    );
    assert.equal(
      chunk.filter(
        (question) =>
          question.mode === "B" && question.answerType === "percent",
      ).length,
      QUESTION_ANSWER_TYPE_COUNTS.B.percent / fileCount,
    );
    assert.equal(
      chunk.filter((question) => question.mode === "C").length,
      QUESTION_MODE_COUNTS.C / fileCount,
    );
  }
});

test("分割取得した各パックから初心者7問・中級者3問を選べる", () => {
  const filenames = (group) =>
    fs
      .readdirSync(path.join(questionsRoot, group))
      .filter((name) => name.endsWith(".json"))
      .sort();
  const files = {
    a: filenames("a"),
    bc: filenames("bc"),
    d: filenames("d"),
  };
  const read = (group, filename) =>
    JSON.parse(
      fs.readFileSync(path.join(questionsRoot, group, filename), "utf8"),
    );

  for (let index = 0; index < 60; index += 1) {
    const pool = [
      ...read("a", files.a[index]),
      ...read("bc", files.bc[index]),
      ...read("d", files.d[index % files.d.length]),
    ];
    const session = createSession(pool, seededRandom(index));
    assert.equal(
      session.filter((question) => question.level === "beginner").length,
      7,
    );
    assert.equal(
      session.filter((question) => question.level === "intermediate").length,
      3,
    );
    assert.equal(
      session.some((question) => question.level === "advanced"),
      false,
    );
  }
});
