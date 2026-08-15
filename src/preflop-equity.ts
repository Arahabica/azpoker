import equityRows from "./generated/preflop-equity-table.json";

const PREFLOP_RANKS = [..."AKQJT98765432"] as const;
const PREFLOP_TIER_LABELS = [
  "とても弱い",
  "弱い",
  "中",
  "強い",
  "とても強い",
] as const;
const PREFLOP_TIER_THRESHOLDS = [16, 22, 25, 30] as const;
const PREFLOP_TIER_COLORS = [
  "#152d26",
  "#b7c7c0",
  "#197847",
  "#ce3f49",
  "#050606",
] as const;

type PreflopTier = 1 | 2 | 3 | 4 | 5;
type PreflopTierLabel = (typeof PREFLOP_TIER_LABELS)[number];

interface PreflopEquityCell {
  hand: string;
  equity: number;
  tier: PreflopTier;
  strength: PreflopTierLabel;
  rowIndex: number;
  columnIndex: number;
}

const equityByHand = new Map(
  equityRows.map((row) => [row.hand, row.players6] as const),
);

function getPreflopHand(rowIndex: number, columnIndex: number): string {
  const rowRank = PREFLOP_RANKS[rowIndex];
  const columnRank = PREFLOP_RANKS[columnIndex];
  if (!rowRank || !columnRank) {
    throw new Error("勝率表の位置が範囲外です");
  }
  if (rowIndex === columnIndex) return `${rowRank}${columnRank}`;
  if (rowIndex < columnIndex) return `${rowRank}${columnRank}s`;
  return `${columnRank}${rowRank}o`;
}

function getPreflopEquity(hand: string): number {
  const equity = equityByHand.get(hand);
  if (equity === undefined) {
    throw new Error(`勝率表に${hand}がありません`);
  }
  return equity;
}

function getPreflopTier(value: number): PreflopTier {
  if (value >= PREFLOP_TIER_THRESHOLDS[3]) return 5;
  if (value >= PREFLOP_TIER_THRESHOLDS[2]) return 4;
  if (value >= PREFLOP_TIER_THRESHOLDS[1]) return 3;
  if (value >= PREFLOP_TIER_THRESHOLDS[0]) return 2;
  return 1;
}

function getPreflopTierRange(tier: PreflopTier): string {
  return tier === 1
    ? `${PREFLOP_TIER_THRESHOLDS[0]}%未満`
    : `${PREFLOP_TIER_THRESHOLDS[tier - 2]}%以上`;
}

const PREFLOP_EQUITY_CELLS: readonly PreflopEquityCell[] =
  PREFLOP_RANKS.flatMap((_, rowIndex) =>
    PREFLOP_RANKS.map((__, columnIndex) => {
      const hand = getPreflopHand(rowIndex, columnIndex);
      const equity = getPreflopEquity(hand);
      const tier = getPreflopTier(equity);
      return Object.freeze({
        hand,
        equity,
        tier,
        strength: PREFLOP_TIER_LABELS[tier - 1]!,
        rowIndex,
        columnIndex,
      });
    }),
  );

if (PREFLOP_EQUITY_CELLS.length !== 169) {
  throw new Error("勝率表は169ハンドである必要があります");
}

export {
  PREFLOP_EQUITY_CELLS,
  PREFLOP_RANKS,
  PREFLOP_TIER_COLORS,
  PREFLOP_TIER_LABELS,
  PREFLOP_TIER_THRESHOLDS,
  getPreflopEquity,
  getPreflopHand,
  getPreflopTier,
  getPreflopTierRange,
};
export type { PreflopEquityCell, PreflopTier, PreflopTierLabel };
