import assert from "node:assert/strict";
import test from "node:test";

import {
  PREFLOP_EQUITY_CELLS,
  PREFLOP_RANKS,
  PREFLOP_TIER_COLORS,
  getPreflopEquity,
  getPreflopHand,
  getPreflopTier,
  getPreflopTierRange,
} from "../src/preflop-equity.ts";

test("169ハンドを既存の13×13表と同じ順序へ配置する", () => {
  assert.equal(PREFLOP_RANKS.join(""), "AKQJT98765432");
  assert.equal(PREFLOP_EQUITY_CELLS.length, 169);
  assert.equal(
    new Set(PREFLOP_EQUITY_CELLS.map((cell) => cell.hand)).size,
    169,
  );
  assert.equal(PREFLOP_EQUITY_CELLS[0].hand, "AA");
  assert.equal(PREFLOP_EQUITY_CELLS[1].hand, "AKs");
  assert.equal(PREFLOP_EQUITY_CELLS[13].hand, "AKo");
  assert.equal(PREFLOP_EQUITY_CELLS.at(-1).hand, "22");
  assert.equal(getPreflopHand(4, 7), "T7s");
  assert.equal(getPreflopHand(7, 4), "T7o");
  const frontHand = PREFLOP_EQUITY_CELLS.find((cell) => cell.hand === "82s");
  assert.deepEqual([frontHand?.rowIndex, frontHand?.columnIndex], [6, 12]);
  assert.throws(() => getPreflopHand(-1, 0), /範囲外/);
});

test("6人卓の実勝率と5段階の強さを共通利用する", () => {
  assert.equal(getPreflopEquity("AA"), 49.2);
  assert.throws(() => getPreflopEquity("missing"), /ありません/);
  assert.deepEqual(
    [15.9, 16, 21.9, 22, 24.9, 25, 29.9, 30].map(getPreflopTier),
    [1, 2, 2, 3, 3, 4, 4, 5],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((tier) => getPreflopTierRange(tier)),
    ["16%未満", "16%以上", "22%以上", "25%以上", "30%以上"],
  );
  assert.equal(PREFLOP_TIER_COLORS.length, 5);
});
