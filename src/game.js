const SESSION_STAGE_COUNTS = Object.freeze({
  preflop: 2,
  flop: 4,
  turn: 4,
});
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

  const selected = [];
  const requiredByStage = {
    preflop: ["flush_draw", "rank_trips"],
    flop: ["rank_hit"],
    turn: ["rank_trips"],
  };
  for (const [stage, count] of Object.entries(SESSION_STAGE_COUNTS)) {
    const stageQuestions = bank.filter((question) => question.stage === stage);
    if (stageQuestions.length < count) {
      throw new Error(`${STAGE_LABELS[stage]}の問題が不足しています`);
    }
    selected.push(
      ...sampleStageQuestions(
        stageQuestions,
        count,
        random,
        requiredByStage[stage],
      ),
    );
  }

  return shuffle(selected, random);
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

function boardRevealSteps(question) {
  if (!question || !Array.isArray(question.board)) {
    throw new TypeError("問題のボードが不正です");
  }

  if (question.stage === "preflop" && question.board.length === 0) {
    return [];
  }

  if (question.stage === "flop" && question.board.length === 3) {
    return [{ street: "flop", cards: [...question.board] }];
  }

  if (question.stage === "turn" && question.board.length === 4) {
    return [
      { street: "flop", cards: question.board.slice(0, 3) },
      { street: "turn", cards: question.board.slice(3) },
    ];
  }

  throw new TypeError(`ステージとボード枚数が一致しません: ${question.stage}`);
}

function stageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage;
}

export {
  SESSION_STAGE_COUNTS,
  boardRevealSteps,
  cardDetails,
  createSession,
  formatActualPercent,
  formatCard,
  formatCards,
  shuffle,
  stageLabel,
};
