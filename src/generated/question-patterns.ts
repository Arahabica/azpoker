// このファイルは questions/patterns.md から自動生成されます。
// 直接編集せず、pnpm patterns:build を実行してください。

import type { GameMode } from "../types.ts";

const QUESTION_BATCH_SIZE = 100 as const;
const QUESTION_TOTAL = 20000 as const;
const QUESTION_MODE_COUNTS = {
  A: 10000,
  B: 4800,
  C: 1200,
  D: 4000,
} as const satisfies Readonly<Record<GameMode, number>>;
const QUESTION_GROUP_COUNTS = {
  A: 10000,
  BC: 6000,
  D: 4000,
} as const;
const QUESTION_PATTERN_COUNTS = {
  A: {
    flush: 1400,
    straight: 1600,
    flush_or_straight: 800,
    rank_hit: 550,
    rank_trips: 500,
    two_pair: 400,
    full_house: 400,
    four_kind: 250,
    straight_flush: 100,
    backdoor_flush: 200,
    flush_draw: 500,
    oesd: 500,
    gutshot: 500,
    board_pair: 350,
    board_two_pair: 300,
    overcard: 400,
    four_flush_board: 350,
    pocket_pair_counterfeit: 350,
    two_pair_counterfeit: 300,
    same_hand_category: 250,
  },
  B: {
    hand_comparison: 3000,
    trailing_hand_wins: 900,
    leading_hand_holds: 900,
  },
  C: {
    preflop_equity: 338,
    postflop_equity: 862,
  },
  D: {
    opponent_rank: 662,
    opponent_pocket_pair: 209,
    opponent_overpair: 209,
    opponent_set: 209,
    opponent_top_pair_plus: 209,
    opponent_two_pair: 209,
    opponent_straight: 209,
    opponent_flush: 209,
    opponent_oesd: 209,
    opponent_gutshot: 209,
    opponent_flush_draw: 209,
    opponent_combo_draw: 208,
    opponent_higher_flush: 208,
    opponent_same_pair_higher_kicker: 208,
    all_opponents_miss_board: 208,
    exactly_one_opponent_target_rank: 208,
    multiple_opponents_target_rank: 208,
  },
} as const satisfies Readonly<
  Record<GameMode, Readonly<Record<string, number>>>
>;
const QUESTION_ANSWER_TYPE_COUNTS = {
  A: {
    percent: 10000,
  },
  B: {
    hand: 3000,
    percent: 1800,
  },
  C: {
    percent: 1200,
  },
  D: {
    percent: 4000,
  },
} as const;
const B_HAND_COMPARISON_ARCHETYPE_COUNTS = {
  pair_vs_overcards: 250,
  pair_vs_high_cards: 100,
  pair_vs_pair: 100,
  domination: 150,
  playable_preflop: 100,
  draw_vs_two_pair_plus: 400,
  top_pair_vs_flush_draw: 500,
  one_pair_kicker: 300,
  combo_hand: 400,
  continue_matchup: 700,
} as const;

type DQuestionFamily = "draw" | "holding" | "table";

const D_CATEGORY_FAMILIES: Readonly<Record<string, DQuestionFamily>> =
  Object.freeze({
    opponent_rank: "holding",
    opponent_pocket_pair: "holding",
    opponent_overpair: "holding",
    opponent_set: "holding",
    opponent_top_pair_plus: "holding",
    opponent_two_pair: "holding",
    opponent_straight: "holding",
    opponent_flush: "holding",
    opponent_oesd: "draw",
    opponent_gutshot: "draw",
    opponent_flush_draw: "draw",
    opponent_combo_draw: "draw",
    opponent_higher_flush: "holding",
    opponent_same_pair_higher_kicker: "holding",
    all_opponents_miss_board: "table",
    exactly_one_opponent_target_rank: "table",
    multiple_opponents_target_rank: "table",
  });

function dQuestionFamily(category: string): DQuestionFamily {
  const family = D_CATEGORY_FAMILIES[category];
  if (!family) throw new Error(`未登録のモードDカテゴリです: ${category}`);
  return family;
}

export {
  B_HAND_COMPARISON_ARCHETYPE_COUNTS,
  D_CATEGORY_FAMILIES,
  QUESTION_ANSWER_TYPE_COUNTS,
  QUESTION_BATCH_SIZE,
  QUESTION_GROUP_COUNTS,
  QUESTION_MODE_COUNTS,
  QUESTION_PATTERN_COUNTS,
  QUESTION_TOTAL,
  dQuestionFamily,
};
export type { DQuestionFamily };
