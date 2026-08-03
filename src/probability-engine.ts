import type { Card, Hole, SourceRank, Suit } from "./types.ts";

type ProbabilityTarget =
  | "flush"
  | "straight"
  | "flush_or_straight"
  | "rank_on_board"
  | "three_of_a_kind";

interface ProbabilityInput {
  hole: Hole;
  board: readonly Card[];
  target: ProbabilityTarget;
  targetRank?: SourceRank;
}

interface ProbabilityResult {
  hits: number;
  total: number;
  probability: number;
  percent: number;
}

const RANKS = "23456789TJQKA";
const SUITS = "cdhs";
const TARGETS = new Set<ProbabilityTarget>([
  "flush",
  "straight",
  "flush_or_straight",
  "rank_on_board",
  "three_of_a_kind",
]);
const RANK_TARGETS = new Set<ProbabilityTarget>([
  "rank_on_board",
  "three_of_a_kind",
]);
const RANK_VALUES: Readonly<Record<SourceRank, number>> = Object.freeze(
  Object.fromEntries([...RANKS].map((rank, index) => [rank, index + 2])),
) as Readonly<Record<SourceRank, number>>;
const STRAIGHT_MASKS = Object.freeze([
  rankMask([14, 2, 3, 4, 5]),
  rankMask([2, 3, 4, 5, 6]),
  rankMask([3, 4, 5, 6, 7]),
  rankMask([4, 5, 6, 7, 8]),
  rankMask([5, 6, 7, 8, 9]),
  rankMask([6, 7, 8, 9, 10]),
  rankMask([7, 8, 9, 10, 11]),
  rankMask([8, 9, 10, 11, 12]),
  rankMask([9, 10, 11, 12, 13]),
  rankMask([10, 11, 12, 13, 14]),
]);
const FULL_DECK: readonly Card[] = Object.freeze(
  [...SUITS].flatMap((suit) =>
    [...RANKS].map((rank) => `${rank}${suit}` as Card),
  ),
);

function isArrayValue(value: unknown): boolean {
  return Array.isArray(value);
}

function rankMask(ranks: readonly number[]): number {
  return ranks.reduce((mask, rank) => mask | (1 << rank), 0);
}

function assertCard(card: unknown): asserts card is Card {
  if (typeof card !== "string" || card.length !== 2) {
    throw new TypeError(`不正なカード表記です: ${String(card)}`);
  }

  if (!RANKS.includes(card[0]!) || !SUITS.includes(card[1]!)) {
    throw new TypeError(`不正なカード表記です: ${card}`);
  }
}

function assertSituation(
  hole: readonly unknown[],
  board: readonly unknown[],
  target: ProbabilityTarget,
  targetRank?: SourceRank,
): void {
  if (!isArrayValue(hole) || hole.length !== 2) {
    throw new TypeError("hole は2枚で指定してください");
  }

  if (!isArrayValue(board) || ![0, 3, 4, 5].includes(board.length)) {
    throw new TypeError("board は0枚、3枚、4枚、5枚のいずれかです");
  }

  if (!TARGETS.has(target)) {
    throw new TypeError(`未対応の完成条件です: ${String(target)}`);
  }

  if (RANK_TARGETS.has(target) && !RANKS.includes(targetRank ?? "")) {
    throw new TypeError(`対象ランクが不正です: ${String(targetRank)}`);
  }

  const cards = [...hole, ...board];
  cards.forEach(assertCard);

  if (new Set(cards).size !== cards.length) {
    throw new TypeError("同じカードが複数回指定されています");
  }
}

function hasFlushUsingHole(
  hole: readonly Card[],
  completedBoard: readonly Card[],
): boolean {
  const suitCounts: Record<Suit, number> = { c: 0, d: 0, h: 0, s: 0 };

  for (const card of [...hole, ...completedBoard]) {
    suitCounts[card[1] as Suit] += 1;
  }

  return hole.some((card) => suitCounts[card[1] as Suit] >= 5);
}

function hasStraightUsingHole(
  hole: readonly Card[],
  completedBoard: readonly Card[],
): boolean {
  let availableMask = 0;
  let holeMask = 0;

  for (const card of [...hole, ...completedBoard]) {
    availableMask |= 1 << RANK_VALUES[card[0] as SourceRank];
  }

  for (const card of hole) {
    holeMask |= 1 << RANK_VALUES[card[0] as SourceRank];
  }

  return STRAIGHT_MASKS.some(
    (straightMask) =>
      (availableMask & straightMask) === straightMask &&
      (holeMask & straightMask) !== 0,
  );
}

function boardContainsRank(
  completedBoard: readonly Card[],
  targetRank: SourceRank,
): boolean {
  return completedBoard.some((card) => card[0] === targetRank);
}

function hasThreeOfAKindUsingHole(
  hole: readonly Card[],
  completedBoard: readonly Card[],
  targetRank: SourceRank,
): boolean {
  if (!hole.some((card) => card[0] === targetRank)) {
    return false;
  }

  return (
    [...hole, ...completedBoard].filter((card) => card[0] === targetRank)
      .length >= 3
  );
}

function isTargetComplete(
  hole: readonly Card[],
  completedBoard: readonly Card[],
  target: ProbabilityTarget,
  targetRank?: SourceRank,
): boolean {
  if (target === "flush") {
    return hasFlushUsingHole(hole, completedBoard);
  }

  if (target === "straight") {
    return hasStraightUsingHole(hole, completedBoard);
  }

  if (target === "rank_on_board") {
    return boardContainsRank(completedBoard, targetRank!);
  }

  if (target === "three_of_a_kind") {
    return hasThreeOfAKindUsingHole(hole, completedBoard, targetRank!);
  }

  return (
    hasFlushUsingHole(hole, completedBoard) ||
    hasStraightUsingHole(hole, completedBoard)
  );
}

function forEachCombination<T>(
  items: readonly T[],
  choose: number,
  visit: (selection: readonly T[]) => void,
): void {
  if (choose === 0) {
    visit([]);
    return;
  }

  const selected = new Array<T>(choose);

  function selectFrom(start: number, depth: number): void {
    if (depth === choose) {
      visit(selected);
      return;
    }

    const lastStart = items.length - (choose - depth);
    for (let index = start; index <= lastStart; index += 1) {
      selected[depth] = items[index]!;
      selectFrom(index + 1, depth + 1);
    }
  }

  selectFrom(0, 0);
}

/**
 * 既知の手札・ボードから、リバーまでに指定した役が完成する確率を全列挙する。
 * 引数を変更せず、同じ入力には常に同じ結果を返す純粋関数。
 */
function calculateProbability({
  hole,
  board,
  target,
  targetRank,
}: ProbabilityInput): Readonly<ProbabilityResult> {
  assertSituation(hole, board, target, targetRank);

  const known = new Set([...hole, ...board]);
  const remainingDeck = FULL_DECK.filter((card) => !known.has(card));
  const cardsToCome = 5 - board.length;
  let hits = 0;
  let total = 0;

  forEachCombination(remainingDeck, cardsToCome, (runout) => {
    total += 1;
    if (isTargetComplete(hole, [...board, ...runout], target, targetRank)) {
      hits += 1;
    }
  });

  return Object.freeze({
    hits,
    total,
    probability: hits / total,
    percent: (hits / total) * 100,
  });
}

export {
  boardContainsRank,
  calculateProbability,
  hasFlushUsingHole,
  hasStraightUsingHole,
  hasThreeOfAKindUsingHole,
  isTargetComplete,
};
