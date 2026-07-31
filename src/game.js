(function attachGameLogic(root, factory) {
  const logic = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = logic;
  }

  if (root) {
    root.AnzanPokerGame = logic;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createGameLogic() {
  "use strict";

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

  function formatCard(card) {
    const rank = card[0];
    const suit = SUIT_SYMBOLS[card[1]];
    if (!suit) {
      throw new TypeError(`不正なカード表記です: ${card}`);
    }
    return `${suit}${rank}`;
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

  function stageLabel(stage) {
    return STAGE_LABELS[stage] ?? stage;
  }

  return Object.freeze({
    SESSION_STAGE_COUNTS,
    createSession,
    formatActualPercent,
    formatCard,
    formatCards,
    shuffle,
    stageLabel,
  });
});
