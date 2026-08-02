const SESSION_MODE_COUNTS = Object.freeze({
  A: 5,
  B: 2,
  C: 1,
  D: 2,
});
const SESSION_STAGE_COUNTS = Object.freeze({
  preflop: 3,
  flop: 4,
  turn: 3,
});
const SESSION_DIFFICULTY_COUNTS = Object.freeze({ medium: 7, hard: 3 });
const SUIT_SYMBOLS = Object.freeze({
  c: "♣",
  d: "♦",
  h: "♥",
  s: "♠",
});
const SUIT_NAMES = Object.freeze({
  c: "クラブ",
  d: "ダイヤ",
  h: "ハート",
  s: "スペード",
});
const RANKS = "23456789TJQKA";
const STAGE_LABELS = Object.freeze({
  preflop: "プリフロップ",
  flop: "フロップ",
  turn: "ターン",
});

function shuffle(items, random = Math.random) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function sample(items, count, random) {
  const selected = [];
  const indexes = new Set();
  while (selected.length < count) {
    const index = Math.floor(random() * items.length);
    if (!indexes.has(index)) {
      indexes.add(index);
      selected.push(items[index]);
    }
  }
  return selected;
}

function sampleStageQuestions(
  questions,
  count,
  random,
  requiredCategories = [],
) {
  const byCategory = new Map();

  for (const question of questions) {
    const existing = byCategory.get(question.category) ?? [];
    existing.push(question);
    byCategory.set(question.category, existing);
  }

  for (const category of requiredCategories) {
    if (!byCategory.has(category)) {
      throw new Error(`必須カテゴリの問題がありません: ${category}`);
    }
  }

  const remainingCategories = [...byCategory.keys()].filter(
    (category) => !requiredCategories.includes(category),
  );
  const categoryOrder = [
    ...requiredCategories,
    ...shuffle(remainingCategories, random),
  ];
  const selected = [];
  let categoryIndex = 0;

  while (selected.length < count) {
    const category = categoryOrder[categoryIndex % categoryOrder.length];
    const candidates = byCategory
      .get(category)
      .filter((question) => !selected.includes(question));

    if (candidates.length > 0) {
      selected.push(shuffle(candidates, random)[0]);
    }

    categoryIndex += 1;
    if (categoryIndex > questions.length * 2) {
      throw new Error("セッションに必要な問題を選べません");
    }
  }

  return selected;
}

function createSession(bank, random = Math.random) {
  if (!Array.isArray(bank) || bank.length === 0) {
    throw new TypeError("問題バンクが空です");
  }

  const byMode = Object.fromEntries(
    Object.keys(SESSION_MODE_COUNTS).map((mode) => [
      mode,
      bank.filter((question) => question.mode === mode),
    ]),
  );
  for (const [mode, count] of Object.entries(SESSION_MODE_COUNTS)) {
    if (byMode[mode].length < count) {
      throw new Error(`モード${mode}の問題が不足しています`);
    }
  }

  const classicB = byMode.B.filter((question) => question.answerType === "hand");
  const numericB = byMode.B.filter((question) => question.answerType === "percent");
  const dFamily = (question) => {
    if (["opponent_oesd", "opponent_gutshot", "opponent_flush_draw", "opponent_combo_draw"].includes(question.category)) return "draw";
    if (["all_opponents_miss_board", "exactly_one_opponent_target_rank", "multiple_opponents_target_rank"].includes(question.category)) return "table";
    return "holding";
  };
  if (classicB.length === 0 || numericB.length === 0) {
    throw new Error("モードBの出題形式が不足しています");
  }

  const slots = [numericB, byMode.C, byMode.D, byMode.D, classicB, ...Array(5).fill(byMode.A)];
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const remainingStages = { ...SESSION_STAGE_COUNTS };
    const remainingDifficulties = { ...SESSION_DIFFICULTY_COUNTS };
    const selected = [];
    const aCategories = new Set();
    let firstD = null;
    let zeroCount = 0;
    let failed = false;

    for (const pool of slots) {
      const candidates = pool.filter((question) => {
        if (remainingStages[question.stage] <= 0 || remainingDifficulties[question.difficulty] <= 0) return false;
        if (question.trueP === 0 && zeroCount >= 1) return false;
        if (question.mode === "A" && aCategories.has(question.category)) return false;
        if (question.mode === "D" && firstD && (
          question.category === firstD.category || dFamily(question) === dFamily(firstD)
        )) return false;
        return true;
      });
      if (candidates.length === 0) {
        failed = true;
        break;
      }
      const question = candidates[Math.floor(random() * candidates.length)];
      selected.push(question);
      remainingStages[question.stage] -= 1;
      remainingDifficulties[question.difficulty] -= 1;
      if (question.trueP === 0) zeroCount += 1;
      if (question.mode === "A") aCategories.add(question.category);
      if (question.mode === "D" && !firstD) firstD = question;
    }
    if (!failed && Object.values(remainingStages).every((count) => count === 0) && Object.values(remainingDifficulties).every((count) => count === 0)) {
      return shuffle(selected, random);
    }
  }
  throw new Error("条件を満たす10問を選べませんでした");
}

function cardDetails(card) {
  if (
    typeof card !== "string" ||
    card.length !== 2 ||
    !RANKS.includes(card[0]) ||
    !SUIT_SYMBOLS[card[1]]
  ) {
    throw new TypeError(`不正なカード表記です: ${card}`);
  }

  const sourceRank = card[0];
  const rank = sourceRank === "T" ? "10" : sourceRank;
  const suit = card[1];
  return Object.freeze({
    rank,
    suit,
    symbol: SUIT_SYMBOLS[suit],
    suitName: SUIT_NAMES[suit],
    tone: suit === "d" || suit === "h" ? "red" : "black",
    ariaLabel: `${SUIT_NAMES[suit]}の${rank}`,
  });
}

function formatCard(card) {
  const details = cardDetails(card);
  return `${details.symbol}${details.rank}`;
}

function formatCards(cards) {
  return cards.map(formatCard).join(" ");
}

function formatActualPercent(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`不正な確率です: ${String(value)}`);
  }

  return `${(Math.round(value * 10) / 10).toFixed(1)}%`;
}

export {
  SESSION_MODE_COUNTS,
  SESSION_DIFFICULTY_COUNTS,
  SESSION_STAGE_COUNTS,
  cardDetails,
  createSession,
  formatActualPercent,
  formatCard,
  formatCards,
  shuffle,
};
