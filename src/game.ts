import type {
  AudienceLevel,
  Difficulty,
  DisplayRank,
  GameMode,
  Question,
  RandomSource,
  SourceRank,
  Stage,
  Suit,
} from "./types.ts";
import { dQuestionFamily } from "./generated/question-patterns.ts";

const SESSION_MODE_COUNTS: Readonly<Record<GameMode, number>> = Object.freeze({
  A: 5,
  B: 2,
  C: 1,
  D: 2,
});
const SESSION_STAGE_COUNTS: Readonly<Record<Stage, number>> = Object.freeze({
  preflop: 2,
  flop: 5,
  turn: 3,
});
const SESSION_DIFFICULTY_COUNTS: Readonly<Record<Difficulty, number>> =
  Object.freeze({ medium: 8, hard: 2 });
const SESSION_LEVEL_COUNTS: Readonly<
  Record<Exclude<AudienceLevel, "advanced">, number>
> = Object.freeze({ beginner: 7, intermediate: 3 });
const SUIT_SYMBOLS: Readonly<Record<Suit, string>> = Object.freeze({
  c: "♣",
  d: "♦",
  h: "♥",
  s: "♠",
});
const SUIT_NAMES: Readonly<Record<Suit, string>> = Object.freeze({
  c: "クラブ",
  d: "ダイヤ",
  h: "ハート",
  s: "スペード",
});
const RANKS = "23456789TJQKA";

interface CardDetails {
  rank: DisplayRank;
  suit: Suit;
  symbol: string;
  suitName: string;
  tone: "red" | "black";
  ariaLabel: string;
}

function isArrayValue(value: unknown): boolean {
  return Array.isArray(value);
}

function shuffle<T>(
  items: readonly T[],
  random: RandomSource = Math.random,
): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index]!;
    result[index] = result[swapIndex]!;
    result[swapIndex] = current;
  }

  return result;
}

function createSession(
  bank: readonly Question[],
  random: RandomSource = Math.random,
  requiredQuestion?: Question,
): Question[] {
  if (!isArrayValue(bank) || bank.length === 0) {
    throw new TypeError("問題バンクが空です");
  }

  const byMode: Record<GameMode, Question[]> = {
    A: bank.filter((question) => question.mode === "A"),
    B: bank.filter((question) => question.mode === "B"),
    C: bank.filter((question) => question.mode === "C"),
    D: bank.filter((question) => question.mode === "D"),
  };
  for (const [mode, count] of Object.entries(SESSION_MODE_COUNTS)) {
    if (byMode[mode as GameMode].length < count) {
      throw new Error(`モード${mode}の問題が不足しています`);
    }
  }

  const classicB = byMode.B.filter(
    (question) => question.answerType === "hand",
  );
  const numericB = byMode.B.filter(
    (question) => question.answerType === "percent",
  );
  if (classicB.length === 0 || numericB.length === 0) {
    throw new Error("モードBの出題形式が不足しています");
  }

  const slots: Question[][] = [
    numericB,
    byMode.C,
    byMode.D,
    byMode.D,
    classicB,
    ...Array<Question[]>(5).fill(byMode.A),
  ];
  let requiredLevel: Exclude<AudienceLevel, "advanced"> | undefined;
  if (requiredQuestion) {
    if (requiredQuestion.level === "advanced") {
      throw new Error("上級者向け問題は通常セッションへ追加できません");
    }
    requiredLevel = requiredQuestion.level;
    const requiredPool =
      requiredQuestion.mode === "A"
        ? byMode.A
        : requiredQuestion.mode === "B"
          ? requiredQuestion.answerType === "hand"
            ? classicB
            : numericB
          : byMode[requiredQuestion.mode];
    const requiredSlotIndex = slots.indexOf(requiredPool);
    if (requiredSlotIndex === -1) {
      throw new Error("履歴問題を通常セッションへ追加できません");
    }
    slots.splice(requiredSlotIndex, 1);
  }
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const remainingStages: Record<Stage, number> = { ...SESSION_STAGE_COUNTS };
    const remainingDifficulties: Record<Difficulty, number> = {
      ...SESSION_DIFFICULTY_COUNTS,
    };
    const remainingLevels: Record<
      Exclude<AudienceLevel, "advanced">,
      number
    > = { ...SESSION_LEVEL_COUNTS };
    const selected: Question[] = requiredQuestion ? [requiredQuestion] : [];
    const aCategories = new Set<string>(
      requiredQuestion?.mode === "A" ? [requiredQuestion.category] : [],
    );
    let firstD: Question | null =
      requiredQuestion?.mode === "D" ? requiredQuestion : null;
    if (requiredQuestion && requiredLevel) {
      remainingStages[requiredQuestion.stage] -= 1;
      remainingDifficulties[requiredQuestion.difficulty] -= 1;
      remainingLevels[requiredLevel] -= 1;
    }
    let failed = false;

    for (const pool of slots) {
      const candidates = pool.filter((question) => {
        if (
          question.id === requiredQuestion?.id ||
          remainingStages[question.stage] <= 0 ||
          remainingDifficulties[question.difficulty] <= 0
        )
          return false;
        if (
          question.level === "advanced" ||
          remainingLevels[question.level] <= 0
        )
          return false;
        if (question.mode === "A" && aCategories.has(question.category))
          return false;
        if (
          question.mode === "D" &&
          firstD &&
          (question.category === firstD.category ||
            dQuestionFamily(question.category) ===
              dQuestionFamily(firstD.category))
        )
          return false;
        return true;
      });
      if (candidates.length === 0) {
        failed = true;
        break;
      }
      const question = candidates[Math.floor(random() * candidates.length)]!;
      if (question.level === "advanced") {
        throw new Error("上級者向け問題は通常セッションへ追加できません");
      }
      selected.push(question);
      remainingStages[question.stage] -= 1;
      remainingDifficulties[question.difficulty] -= 1;
      remainingLevels[question.level] -= 1;
      if (question.mode === "A") aCategories.add(question.category);
      if (question.mode === "D" && !firstD) firstD = question;
    }
    if (
      !failed &&
      Object.values(remainingStages).every((count) => count === 0) &&
      Object.values(remainingDifficulties).every((count) => count === 0) &&
      Object.values(remainingLevels).every((count) => count === 0)
    ) {
      return shuffle(selected, random);
    }
  }
  throw new Error("条件を満たす10問を選べませんでした");
}

function cardDetails(card: string): Readonly<CardDetails> {
  if (typeof card !== "string" || card.length !== 2) {
    throw new TypeError(`不正なカード表記です: ${card}`);
  }

  const candidateRank = card[0];
  const candidateSuit = card[1];
  if (
    !RANKS.includes(candidateRank ?? "") ||
    !candidateSuit ||
    !(candidateSuit in SUIT_SYMBOLS)
  ) {
    throw new TypeError(`不正なカード表記です: ${card}`);
  }

  const sourceRank = candidateRank as SourceRank;
  const rank: DisplayRank = sourceRank === "T" ? "10" : sourceRank;
  const suit = candidateSuit as Suit;
  return Object.freeze({
    rank,
    suit,
    symbol: SUIT_SYMBOLS[suit],
    suitName: SUIT_NAMES[suit],
    tone: suit === "d" || suit === "h" ? "red" : "black",
    ariaLabel: `${SUIT_NAMES[suit]}の${rank}`,
  });
}

function formatCard(card: string): string {
  const details = cardDetails(card);
  return `${details.symbol}${details.rank}`;
}

function formatCards(cards: readonly string[]): string {
  return cards.map(formatCard).join(" ");
}

function formatActualPercent(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError(`不正な確率です: ${String(value)}`);
  }

  return `${(Math.round(value * 10) / 10).toFixed(1)}%`;
}

export {
  SESSION_MODE_COUNTS,
  SESSION_DIFFICULTY_COUNTS,
  SESSION_LEVEL_COUNTS,
  SESSION_STAGE_COUNTS,
  cardDetails,
  createSession,
  formatActualPercent,
  formatCard,
  formatCards,
  shuffle,
};
