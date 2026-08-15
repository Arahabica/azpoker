#!/usr/bin/env python3
"""正本に定義された問題を生成し、用途別の100問JSONへ分割する。"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
import random
import re
import shutil
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from functools import lru_cache
from pathlib import Path

from generated.question_patterns import (
    A_COUNTS,
    B_HAND_COMPARISON_STAGE_TARGETS,
    BATCH_SIZE,
    B_BEGINNER_ARCHETYPES,
    C_POSTFLOP_PER_PLAYER,
    D_OPPONENT_RANK_STAGE_COUNTS,
    GROUP_COUNTS,
    LEGACY_MODE_COUNTS,
    MODE_COUNTS,
    NEW_A_COUNTS,
    NEW_B_COUNTS,
    NEW_D_COUNTS,
    PATTERN_BY_KEY,
    QUESTION_PATTERN_COUNTS,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "questions"
RANKS = "23456789TJQKA"
SUITS = "cdhs"
SUIT_NAMES = {"c": "クラブ", "d": "ダイヤ", "h": "ハート", "s": "スペード"}
DECK = tuple(f"{rank}{suit}" for rank in RANKS for suit in SUITS)
RANK_VALUE = {rank: index + 2 for index, rank in enumerate(RANKS)}
DISPLAY_RANK = {"T": "10"}
BUCKETS = (0, 1, 2, 3, 5, 7.5, 10, 12.5, 15, 17.5, 20, *range(25, 101, 5))
HAND_NAMES = ("ハイカード", "ワンペア", "ツーペア", "スリー", "ストレート", "フラッシュ", "フルハウス", "フォーカード", "ストレートフラッシュ")
BOARD_THREAT_CATEGORIES = {
    "opponent_straight_three_connected_board",
    "opponent_straight_four_connected_board",
    "opponent_flush_three_suited_board",
    "opponent_flush_four_suited_board",
}
STRAIGHT_SEQUENCES = (
    ("A", "2", "3", "4", "5"),
    *(tuple(RANKS[start:start + 5]) for start in range(9)),
)


def display_rank(rank: str) -> str:
    return DISPLAY_RANK.get(rank, rank)


def nearest_bucket(value: float) -> float:
    return min(BUCKETS, key=lambda bucket: (abs(bucket - value), -bucket))


def percent_label(value: float) -> str:
    return f"{value:g}%"


def minimum_choice_gap(correct: float) -> float:
    """Keep normal probabilities readable while retaining detail near zero."""
    if correct == 0:
        return 3
    if correct <= 3:
        return 2
    if correct < 20:
        return 5
    return 10


def spaced_distractor(correct: float, wrong: float) -> float:
    """Move an overly close distractor outward without changing its direction."""
    minimum_gap = minimum_choice_gap(correct)
    if (
        wrong != correct
        and abs(wrong - correct) >= minimum_gap
        and not (correct > 0 and wrong == 0)
    ):
        return wrong

    candidates = tuple(
        bucket
        for bucket in BUCKETS
        if bucket != correct and abs(bucket - correct) >= minimum_gap
        and not (correct > 0 and bucket == 0)
    )
    direction = 1 if wrong >= correct else -1
    same_direction = tuple(
        bucket
        for bucket in candidates
        if (bucket - correct) * direction > 0
        and not (correct > 0 and bucket == 0)
    )
    pool = same_direction or candidates
    return min(
        pool,
        key=lambda bucket: (abs(bucket - correct), abs(bucket - wrong)),
    )


def canonical_cards(groups: list[list[str]]) -> str:
    suit_map: dict[str, str] = {}
    normalized = []
    for group in groups:
        normalized_group = []
        for card in group:
            if card[1] not in suit_map:
                suit_map[card[1]] = SUITS[len(suit_map)]
            normalized_group.append(f"{card[0]}{suit_map[card[1]]}")
        normalized.append(sorted(normalized_group))
    return json.dumps(normalized, separators=(",", ":"))


def straight_high(values: set[int]) -> int:
    values = set(values)
    if 14 in values:
        values.add(1)
    return max(
        (high for high in range(5, 15) if set(range(high - 4, high + 1)) <= values),
        default=0,
    )


def evaluate(cards: tuple[str, ...]) -> tuple[int, ...]:
    values = [RANK_VALUE[card[0]] for card in cards]
    counts = Counter(values)
    by_count = sorted(((count, value) for value, count in counts.items()), reverse=True)
    suit_cards = {
        suit: sorted((RANK_VALUE[card[0]] for card in cards if card[1] == suit), reverse=True)
        for suit in SUITS
    }
    for suited_values in suit_cards.values():
        if len(suited_values) >= 5:
            high = straight_high(set(suited_values))
            if high:
                return (8, high)
    if by_count[0][0] == 4:
        kicker = max(value for value in values if value != by_count[0][1])
        return (7, by_count[0][1], kicker)
    trips = sorted((value for value, count in counts.items() if count >= 3), reverse=True)
    pairs = sorted((value for value, count in counts.items() if count >= 2), reverse=True)
    if trips:
        pair_candidates = [value for value in pairs if value != trips[0]]
        if pair_candidates:
            return (6, trips[0], pair_candidates[0])
    flush_values = max((values for values in suit_cards.values() if len(values) >= 5), default=[])
    if flush_values:
        return (5, *flush_values[:5])
    high = straight_high(set(values))
    if high:
        return (4, high)
    if trips:
        kickers = sorted((value for value in values if value != trips[0]), reverse=True)[:2]
        return (3, trips[0], *kickers)
    if len(pairs) >= 2:
        kicker = max(value for value in values if value not in pairs[:2])
        return (2, pairs[0], pairs[1], kicker)
    if pairs:
        kickers = sorted((value for value in values if value != pairs[0]), reverse=True)[:3]
        return (1, pairs[0], *kickers)
    return (0, *sorted(values, reverse=True)[:5])


def has_flush(cards: tuple[str, ...]) -> bool:
    return max(Counter(card[1] for card in cards).values()) >= 5


def has_straight(cards: tuple[str, ...]) -> bool:
    return bool(straight_high({RANK_VALUE[card[0]] for card in cards}))


def has_flush_using_hole(hole: tuple[str, str], board: tuple[str, ...]) -> bool:
    cards = (*hole, *board)
    return any(
        any(card[1] == suit for card in hole)
        and sum(card[1] == suit for card in cards) >= 5
        for suit in SUITS
    )


def has_straight_using_hole(hole: tuple[str, str], board: tuple[str, ...]) -> bool:
    cards = (*hole, *board)
    values = {RANK_VALUE[card[0]] for card in cards}
    hole_values = {RANK_VALUE[card[0]] for card in hole}
    if 14 in values:
        values.add(1)
    if 14 in hole_values:
        hole_values.add(1)
    return any(
        sequence <= values and bool(sequence & hole_values)
        for sequence in (
            {14, 2, 3, 4, 5},
            *(set(range(low, low + 5)) for low in range(2, 11)),
        )
    )


def has_straight_flush_using_hole(hole: tuple[str, str], board: tuple[str, ...]) -> bool:
    cards = (*hole, *board)
    for suit in SUITS:
        suited = tuple(card for card in cards if card[1] == suit)
        suited_hole = tuple(card for card in hole if card[1] == suit)
        if suited_hole and has_straight_using_hole(suited_hole, tuple(card for card in suited if card not in suited_hole)):
            return True
    return False


def target_complete(
    hole: tuple[str, str],
    board: tuple[str, ...],
    category: str,
    target_rank: str | None = None,
) -> bool:
    cards = (*hole, *board)
    if category == "flush":
        return has_flush_using_hole(hole, board)
    if category == "straight":
        return has_straight_using_hole(hole, board)
    if category == "flush_or_straight":
        return has_flush_using_hole(hole, board) or has_straight_using_hole(hole, board)
    if category == "straight_flush":
        return has_straight_flush_using_hole(hole, board)
    if category == "rank_hit":
        return any(card[0] == target_rank for card in board)
    if category == "rank_trips":
        return sum(card[0] == target_rank for card in cards) >= 3
    if category == "two_pair":
        return evaluate(cards)[0] == 2
    if category == "full_house":
        return evaluate(cards)[0] == 6
    if category == "four_kind":
        return evaluate(cards)[0] == 7
    raise ValueError(category)


def exact_target_percent(
    hole: tuple[str, str], board: tuple[str, ...], category: str, target_rank: str | None
) -> float:
    remaining = tuple(card for card in DECK if card not in {*hole, *board})
    total = hits = 0
    for runout in itertools.combinations(remaining, 5 - len(board)):
        total += 1
        hits += target_complete(hole, (*board, *runout), category, target_rank)
    return hits / total * 100


def draw_cards(rng: random.Random, count: int, excluded: set[str]) -> tuple[str, ...]:
    return tuple(rng.sample([card for card in DECK if card not in excluded], count))


def straight_sequence(rng: random.Random) -> tuple[str, ...]:
    high = rng.randint(5, 14)
    values = (14, 2, 3, 4, 5) if high == 5 else tuple(range(high - 4, high + 1))
    reverse = {value: rank for rank, value in RANK_VALUE.items()}
    return tuple(reverse[value] for value in values)


def build_a_state(category: str, rng: random.Random):
    stage = rng.choice(("flop", "flop", "turn"))
    board_size = 3 if stage == "flop" else 4
    target_rank = None

    if category in {"rank_hit", "rank_trips", "four_kind"}:
        target_rank = rng.choice(RANKS)
    if category == "rank_hit":
        hole = (f"{target_rank}{rng.choice(SUITS)}", rng.choice(DECK))
        while hole[1] == hole[0] or hole[1][0] == target_rank:
            hole = (hole[0], rng.choice(DECK))
        board = draw_cards(rng, board_size, set(hole) | {f"{target_rank}{suit}" for suit in SUITS})
        return stage, hole, board, target_rank
    if category == "rank_trips":
        suits = rng.sample(SUITS, 2)
        hole = (f"{target_rank}{suits[0]}", f"{target_rank}{suits[1]}")
        board = draw_cards(rng, board_size, set(hole) | {f"{target_rank}{suit}" for suit in SUITS})
        return stage, hole, board, target_rank
    if category == "four_kind":
        suits = rng.sample(SUITS, 3)
        hole = (f"{target_rank}{suits[0]}", f"{target_rank}{suits[1]}")
        board = (f"{target_rank}{suits[2]}", *draw_cards(rng, board_size - 1, {f"{target_rank}{suit}" for suit in SUITS}))
        return stage, hole, board, target_rank
    if category in {"two_pair", "full_house"}:
        first, second = rng.sample(RANKS, 2)
        suits = rng.sample(SUITS, 2)
        hole = (f"{first}{suits[0]}", f"{first}{suits[1]}")
        excluded = set(hole) | {f"{first}{suit}" for suit in SUITS}
        if category == "full_house":
            board_start = (f"{second}{rng.choice(SUITS)}",)
        else:
            board_start = ()
        board = (*board_start, *draw_cards(rng, board_size - len(board_start), excluded | set(board_start)))
        return stage, hole, board, None
    if category == "straight_flush":
        suit = rng.choice(SUITS)
        sequence = straight_sequence(rng)
        missing = rng.choice(sequence)
        suited = [f"{rank}{suit}" for rank in sequence if rank != missing]
        rng.shuffle(suited)
        hole = tuple(suited[:2])
        board_start = tuple(suited[2:4])
        board = (*board_start, *draw_cards(rng, board_size - 2, set(suited)))
        return stage, hole, board, None
    if category == "flush":
        suit = rng.choice(SUITS)
        suited = rng.sample([f"{rank}{suit}" for rank in RANKS], 4)
        hole = tuple(suited[:2])
        board_start = tuple(suited[2:])
        board = (*board_start, *draw_cards(rng, board_size - len(board_start), set(suited)))
        return stage, hole, board, None
    if category == "straight":
        sequence = straight_sequence(rng)
        present_count = 4
        ranks = rng.sample(sequence, present_count)
        known = []
        for rank in ranks:
            known.append(f"{rank}{rng.choice(SUITS)}")
        hole = tuple(known[:2])
        board_start = tuple(known[2:])
        board = (*board_start, *draw_cards(rng, board_size - len(board_start), set(known)))
        return stage, hole, board, None

    # コンボドローはランダム候補から、フラッシュとストレートの両方に可能性がある形を探す。
    while True:
        stage = rng.choice(("flop", "turn"))
        board_size = 3 if stage == "flop" else 4
        cards = tuple(rng.sample(DECK, 2 + board_size))
        hole, board = cards[:2], cards[2:]
        if target_complete(hole, board, "flush") or target_complete(hole, board, "straight"):
            continue
        if exact_target_percent(hole, board, "flush", None) > 0 and exact_target_percent(hole, board, "straight", None) > 0:
            return stage, hole, board, None


def prompt_and_explanation(category: str, target_rank: str | None, stage: str, value: float):
    rank = display_rank(target_rank) if target_rank else ""
    copy = {
        "flush": ("フラッシュの確率は？", "同じマークが5枚そろう可能性です。"),
        "straight": ("ストレートの確率は？", "数字や文字が5つ連続してそろう可能性です。"),
        "flush_or_straight": ("フラッシュかストレートの確率は？", "2種類の待ちで重なるカードは一度だけ数えます。"),
        "rank_hit": (f"{rank}が出る確率は？", f"見えていない{rank}の枚数から考えます。"),
        "rank_trips": (f"{rank}がスリーになる確率は？", "同じ数字や文字が3枚になる可能性です。"),
        "two_pair": ("ツーペアの確率は？", "異なる2つのペアができる可能性です。"),
        "full_house": ("フルハウスの確率は？", "スリーとペアが同時にできる可能性です。"),
        "four_kind": ("フォーカードの確率は？", "同じ数字や文字が4枚そろう可能性です。"),
        "straight_flush": ("ストレートフラッシュの確率は？", "同じマークで、数字や文字が5つ連続してそろう可能性です。"),
    }[category]
    if category == "flush_or_straight":
        return copy[0], "複数の役を同時に待つ形（コンボドロー）で、重なるカードは一度だけ数えます。"
    if category == "straight":
        if (stage == "flop" and value >= 25) or (stage == "turn" and value >= 14):
            return copy[0], "両端を待つ形（OESD）や、内側の待ちが2種類ある形（ダブルガット）です。"
        if value >= 8:
            return copy[0], "内側の1種類だけを待つ形（ガットショット）です。"
        raise ValueError(f"通常のストレートドローとして低すぎる確率です: {value}")
    return copy


def distractor(value: float, category: str, stage: str) -> tuple[str, str]:
    correct = nearest_bucket(value)
    if value == 0:
        return percent_label(3), "残り枚数を確認せず、わずかなアウツがあると考える"
    models = {
        "flush": "残り1枚と2枚の確率を混同する",
        "straight": "待ちの種類または必要なカード枚数を取り違える",
        "flush_or_straight": "重複アウツを二重に数える",
        "rank_hit": "見えていない同ランクの枚数を取り違える",
        "rank_trips": "残り1枚と2枚の確率を混同する",
        "two_pair": "フルハウスになる組合せもツーペアとして数える",
        "full_house": "スリーとペアの両方が必要なことを見落とす",
        "four_kind": "残り1枚のアウツを過大評価する",
        "straight_flush": "フラッシュまたはストレート単独のアウツを含める",
    }
    if correct <= 3:
        wrong = 5
    elif correct <= 10:
        wrong = correct + 5
    elif correct <= 25:
        wrong = correct - 7.5 if stage == "turn" else correct + 10
    elif correct <= 65:
        wrong = correct - 15
    else:
        wrong = correct - 15
    wrong = spaced_distractor(
        correct,
        nearest_bucket(max(0, min(100, wrong))),
    )
    if wrong == correct:
        wrong = spaced_distractor(correct, nearest_bucket(max(0, correct - 10)))
    return percent_label(wrong), models[category]


def build_mode_a(rng: random.Random) -> list[dict]:
    questions = []
    seen = set()
    for category, count in A_COUNTS.items():
        category_questions = []
        attempts = 0
        while len(category_questions) < count:
            attempts += 1
            if attempts > count * 3000:
                raise RuntimeError(f"A/{category} の生成候補が不足")
            stage, hole, board, target_rank = build_a_state(category, rng)
            if len(set((*hole, *board))) != len(hole) + len(board):
                continue
            if target_complete(hole, board, category, target_rank):
                continue
            key = f"{category}:{target_rank}:{stage}:{canonical_cards([list(hole), list(board)])}"
            if key in seen:
                continue
            value = round(exact_target_percent(hole, board, category, target_rank), 2)
            if value == 0:
                continue
            answer = percent_label(nearest_bucket(value))
            wrong, model = distractor(value, category, stage)
            prompt, explain = prompt_and_explanation(category, target_rank, stage, value)
            question = {
                "id": f"a-{len(questions) + len(category_questions) + 1:05d}",
                "mode": "A", "stage": stage, "hole": list(hole), "board": list(board),
                "target": category, "trueP": value, "answer": answer, "distractor": wrong,
                "category": category, "prompt": prompt, "explain": explain,
                "difficulty": "hard" if rng.random() < 0.3 else "medium",
                "distractorModel": model, "conceptKey": key,
            }
            if target_rank:
                question["targetRank"] = target_rank
            category_questions.append(question)
            seen.add(key)
        questions.extend(category_questions)
    for index, question in enumerate(questions, 1):
        question["id"] = f"a-{index:05d}"
    return questions


def equity(hands: tuple[tuple[str, str], ...], board: tuple[str, ...], rng: random.Random, trials: int | None = None):
    known = {card for hand in hands for card in hand} | set(board)
    deck = [card for card in DECK if card not in known]
    runout_count = 5 - len(board)
    wins = [0.0] * len(hands)
    if trials is None:
        runouts = itertools.combinations(deck, runout_count)
    else:
        runouts = (tuple(rng.sample(deck, runout_count)) for _ in range(trials))
    total = 0
    for runout in runouts:
        scores = [evaluate((*hand, *board, *runout)) for hand in hands]
        best = max(scores)
        winners = [index for index, score in enumerate(scores) if score == best]
        for winner in winners:
            wins[winner] += 1 / len(winners)
        total += 1
    return [round(win / total * 100, 2) for win in wins]


def preflop_comparison_equity_task(args) -> list[float]:
    hands, seed = args
    return equity(hands, (), random.Random(seed), 12_000)


def board_hand_category(board: tuple[str, ...]) -> int:
    counts = Counter(card[0] for card in board)
    groups = sorted(counts.values(), reverse=True)
    if groups and groups[0] == 4:
        return 7
    if groups and groups[0] == 3:
        return 3
    if len([count for count in groups if count >= 2]) >= 2:
        return 2
    if groups and groups[0] == 2:
        return 1
    return 0


def straight_draw_missing_ranks_using_hole(
    hole: tuple[str, str], board: tuple[str, ...]
) -> set[int]:
    values = {RANK_VALUE[card[0]] for card in (*hole, *board)}
    hole_values = {RANK_VALUE[card[0]] for card in hole}
    if 14 in values:
        values.add(1)
    if 14 in hole_values:
        hole_values.add(1)
    missing = set()
    sequences = (
        {14, 2, 3, 4, 5},
        *(set(range(low, low + 5)) for low in range(2, 11)),
    )
    for sequence in sequences:
        absent = sequence - values
        if len(absent) == 1 and sequence & hole_values:
            missing.update(14 if value == 1 else value for value in absent)
    return missing


def preflop_continuation_reasons(hole: tuple[str, str]) -> tuple[str, ...]:
    first = RANK_VALUE[hole[0][0]]
    second = RANK_VALUE[hole[1][0]]
    high, low = max(first, second), min(first, second)
    suited = hole[0][1] == hole[1][1]
    reasons = []
    if first == second:
        reasons.append("pocket_pair")
    if low >= 10:
        reasons.append("broadway")
    if high == 14 and (low >= 9 or suited):
        reasons.append("playable_ace")
    if high == 13 and (low >= 10 or suited and low >= 8):
        reasons.append("playable_king")
    if suited and low >= 4 and high - low <= 2:
        reasons.append("suited_connector")
    return tuple(reasons)


def postflop_continuation_reasons(
    hole: tuple[str, str], board: tuple[str, ...]
) -> tuple[str, ...]:
    score = evaluate((*hole, *board))
    top_board = max(RANK_VALUE[card[0]] for card in board)
    board_values = {RANK_VALUE[card[0]] for card in board}
    hole_values = [RANK_VALUE[card[0]] for card in hole]
    reasons = []

    if score[0] >= 2 and score[0] > board_hand_category(board):
        reasons.append("two_pair_plus")
    if hole[0][0] == hole[1][0] and hole_values[0] > top_board:
        reasons.append("overpair")
    if top_board in hole_values:
        reasons.append("top_pair")

    flush_draw = has_flush_draw_using_hole(hole, board)
    missing = straight_draw_missing_ranks_using_hole(hole, board)
    if flush_draw:
        reasons.append("flush_draw")
    if len(missing) >= 2:
        reasons.append("oesd_or_double_gut")
    elif len(missing) == 1:
        reasons.append("gutshot")

    paired_below_top = bool(set(hole_values) & (board_values - {top_board}))
    if paired_below_top and flush_draw:
        reasons.append("middle_pair+flush_draw")
    if paired_below_top and missing:
        reasons.append("middle_pair+straight_draw")
    return tuple(reasons)


def continuation_reasons(
    hole: tuple[str, str], board: tuple[str, ...]
) -> tuple[str, ...]:
    return (
        preflop_continuation_reasons(hole)
        if not board
        else postflop_continuation_reasons(hole, board)
    )


def comparison_archetype(
    hands: tuple[tuple[str, str], tuple[str, str]],
    board: tuple[str, ...],
    reasons: tuple[tuple[str, ...], tuple[str, ...]],
) -> str:
    if not board:
        pairs = ["pocket_pair" in hand_reasons for hand_reasons in reasons]
        if pairs.count(True) == 1:
            pair_index = pairs.index(True)
            pair_rank = RANK_VALUE[hands[pair_index][0][0]]
            other = hands[1 - pair_index]
            if all(RANK_VALUE[card[0]] > pair_rank for card in other):
                return "pair_vs_overcards"
            return "pair_vs_high_cards"
        if pairs.count(True) == 2:
            return "pair_vs_pair"
        if {card[0] for card in hands[0]} & {card[0] for card in hands[1]}:
            return "domination"
        return "playable_preflop"

    reason_sets = [set(hand_reasons) for hand_reasons in reasons]
    made_two_pair = ["two_pair_plus" in hand_reasons for hand_reasons in reason_sets]
    strong_draw = [
        bool({"flush_draw", "oesd_or_double_gut"} & hand_reasons)
        for hand_reasons in reason_sets
    ]
    if any(made_two_pair[index] and strong_draw[1 - index] for index in (0, 1)):
        return "draw_vs_two_pair_plus"
    if any(
        bool({"top_pair", "overpair"} & reason_sets[index])
        and "flush_draw" in reason_sets[1 - index]
        for index in (0, 1)
    ):
        return "top_pair_vs_flush_draw"
    if all("top_pair" in hand_reasons for hand_reasons in reason_sets):
        return "one_pair_kicker"
    if any(any("+" in reason for reason in hand_reasons) for hand_reasons in reasons):
        return "combo_hand"
    return "continue_matchup"


def is_obvious_preflop_comparison(
    hands: tuple[tuple[str, str], tuple[str, str]],
) -> bool:
    """Rank-only matchups whose stronger hand is apparent without calculation."""
    rank_pairs = [
        tuple(
            sorted(
                (RANK_VALUE[card[0]] for card in hand),
                reverse=True,
            )
        )
        for hand in hands
    ]
    if any(high == low for high, low in rank_pairs):
        return False
    first, second = rank_pairs
    coordinate_dominance = (
        first[0] > second[0] and first[1] > second[1]
    ) or (
        second[0] > first[0] and second[1] > first[1]
    )
    shared_rank_with_better_kicker = first[0] == second[0] and first[1] != second[1]
    return coordinate_dominance or shared_rank_with_better_kicker


def comparison_profile(hands: tuple[tuple[str, str], tuple[str, str]], board: tuple[str, ...], equities: list[float]):
    current_scores = [evaluate((*hand, *board))[0] for hand in hands]
    reasons = tuple(continuation_reasons(hand, board) for hand in hands)
    if not all(reasons):
        return True, "medium", "", "", "unplayable", reasons
    archetype = comparison_archetype(hands, board, reasons)
    factors = {reason for hand_reasons in reasons for reason in hand_reasons}
    best = max(equities)
    category_gap = abs(current_scores[0] - current_scores[1])
    obvious = (
        (not board and is_obvious_preflop_comparison(hands))
        or (bool(board) and best >= 95 and category_gap >= 1 and len(factors) == 1)
        or (bool(board) and best >= 90 and category_gap >= 2 and len(factors) <= 2)
    )
    difficulty = "hard" if len(factors) >= 3 or best <= 60 else "medium"
    explanation = (
        "手札のペア、高いカード、同じマークかを比べます。"
        if not board
        else f"現在は{HAND_NAMES[current_scores[0]]}と{HAND_NAMES[current_scores[1]]}。残りのドローとキッカーも比べます。"
    )
    return (
        obvious,
        difficulty,
        explanation,
        "+".join(sorted(factors)),
        archetype,
        reasons,
    )


def build_mode_b(
    rng: random.Random,
    existing: list[dict] | None = None,
) -> list[dict]:
    questions = []
    seen = set()
    stage_targets = B_HAND_COMPARISON_STAGE_TARGETS
    if existing:
        for stage, targets in stage_targets.items():
            for archetype, target in targets.items():
                candidates = [
                    question
                    for question in existing
                    if question["stage"] == stage
                    and question.get("archetype") == archetype
                    and (
                        stage != "preflop"
                        or (
                            max(question["equities"]) >= 51
                            and not is_obvious_preflop_comparison(
                                tuple(tuple(hand) for hand in question["hands"])
                            )
                        )
                    )
                ]
                candidates.sort(
                    key=lambda question: (
                        max(question["equities"]),
                        question["id"],
                    )
                )
                for question in candidates[:target]:
                    questions.append(question)
                    seen.add(question["conceptKey"])
    for stage, targets in stage_targets.items():
        count = sum(targets.values())
        archetype_counts = Counter(
            question["archetype"]
            for question in questions
            if question["stage"] == stage
        )
        attempts = 0
        board_size = {"preflop": 0, "flop": 3, "turn": 4}[stage]
        while sum(question["stage"] == stage for question in questions) < count:
            attempts += 1
            if attempts > count * 20_000:
                raise RuntimeError(f"B/{stage} の実戦的な対決候補が不足")
            cards = tuple(rng.sample(DECK, 4 + board_size))
            hands = (cards[:2], cards[2:4])
            board = cards[4:]
            key = f"{stage}:{canonical_cards([list(hands[0]), list(hands[1]), list(board)])}"
            if key in seen:
                continue
            reasons = tuple(continuation_reasons(hand, board) for hand in hands)
            if not all(reasons):
                continue
            archetype = comparison_archetype(hands, board, reasons)
            if archetype not in targets or archetype_counts[archetype] >= targets[archetype]:
                continue
            if stage == "preflop" and is_obvious_preflop_comparison(hands):
                continue
            equities = equity(
                hands,
                board,
                rng,
                12_000 if stage == "preflop" else None,
            )
            winner = 0 if equities[0] > equities[1] else 1
            best = equities[winner]
            if best < 51:
                continue
            obvious, difficulty, explain, factors, archetype, reasons = comparison_profile(
                hands, board, equities
            )
            if obvious:
                continue
            question = {
                "id": f"b-{len(questions) + 1:05d}", "mode": "B", "stage": stage,
                "hands": [list(hand) for hand in hands], "board": list(board),
                "equities": equities, "trueP": best, "answer": winner,
                "category": "hand_comparison", "prompt": "勝率が高いのは？",
                "explain": explain, "difficulty": difficulty,
                "archetype": archetype,
                "continuationReasons": [list(reason) for reason in reasons],
                "distractorModel": f"比較要素の一部だけを過大評価する: {factors}", "conceptKey": key,
            }
            if stage == "preflop":
                question["simulationTrials"] = 12_000
            questions.append(question)
            seen.add(key)
            archetype_counts[archetype] += 1
    questions.sort(
        key=lambda question: (
            ("preflop", "flop", "turn").index(question["stage"]),
            question["id"],
        )
    )
    for index, question in enumerate(questions, 1):
        question["id"] = f"b-{index:05d}"
    return questions


def refresh_preflop_comparison_equities(questions: list[dict]) -> list[dict]:
    preflop = [question for question in questions if question["stage"] == "preflop"]
    tasks = [
        (
            tuple(tuple(hand) for hand in question["hands"]),
            2026081300 + index,
        )
        for index, question in enumerate(preflop)
    ]
    with ProcessPoolExecutor() as executor:
        values = executor.map(preflop_comparison_equity_task, tasks)
        for question, equities in zip(preflop, values, strict=True):
            hands = tuple(tuple(hand) for hand in question["hands"])
            obvious, difficulty, explain, factors, archetype, reasons = comparison_profile(
                hands,
                (),
                equities,
            )
            if obvious:
                raise RuntimeError(f"差が明白なプリフロップ比較です: {question['id']}")
            winner = 0 if equities[0] > equities[1] else 1
            question["equities"] = equities
            question["trueP"] = equities[winner]
            question["answer"] = winner
            question["difficulty"] = difficulty
            question["explain"] = explain
            question["archetype"] = archetype
            question["continuationReasons"] = [list(reason) for reason in reasons]
            question["distractorModel"] = (
                f"比較要素の一部だけを過大評価する: {factors}"
            )
            question["simulationTrials"] = 12_000
    return questions


def starting_hands() -> list[tuple[str, tuple[str, str]]]:
    hands = []
    for high_index in range(len(RANKS) - 1, -1, -1):
        high = RANKS[high_index]
        hands.append((f"{high}{high}", (f"{high}h", f"{high}d")))
        for low_index in range(high_index - 1, -1, -1):
            low = RANKS[low_index]
            hands.append((f"{high}{low}s", (f"{high}h", f"{low}h")))
            hands.append((f"{high}{low}o", (f"{high}h", f"{low}d")))
    return hands


def multiway_equity(hole: tuple[str, str], players: int, rng: random.Random, trials: int = 30_000) -> float:
    deck = [card for card in DECK if card not in hole]
    score = 0.0
    for _ in range(trials):
        dealt = rng.sample(deck, (players - 1) * 2 + 5)
        opponents = [tuple(dealt[index:index + 2]) for index in range(0, (players - 1) * 2, 2)]
        board = tuple(dealt[(players - 1) * 2:])
        scores = [evaluate((*hole, *board)), *(evaluate((*hand, *board)) for hand in opponents)]
        hero = scores[0]
        if hero == max(scores):
            score += 1 / scores.count(hero)
    return round(score / trials * 100, 2)


def multiway_equity_task(args) -> float:
    hole, players, seed = args
    return multiway_equity(hole, players, random.Random(seed))


def c_distractor(value: float, players: int) -> tuple[str, str]:
    correct = nearest_bucket(value)
    if players == 2:
        wrong = correct - 15 if correct >= 55 else correct + 15
        model = "キッカーやスーテッドの価値を過大または過小評価する"
    else:
        wrong = correct - 15 if correct >= 35 else correct + 10
        model = "人数が増えたときの勝率低下を過大または過小評価する"
    wrong = spaced_distractor(
        correct,
        nearest_bucket(max(0, min(100, wrong))),
    )
    return percent_label(wrong), model


def build_mode_c(rng: random.Random) -> list[dict]:
    questions = []
    entries = [
        (label, hole, players)
        for label, hole in starting_hands()
        for players in (6, 9)
    ]
    tasks = [
        (hole, players, 2026080200 + index)
        for index, (_label, hole, players) in enumerate(entries)
    ]
    with ProcessPoolExecutor() as executor:
        values = executor.map(multiway_equity_task, tasks)
        for (label, hole, players), value in zip(entries, values, strict=True):
            answer = percent_label(nearest_bucket(value))
            wrong, model = c_distractor(value, players)
            questions.append({
                "id": f"c-{len(questions) + 1:04d}", "mode": "C", "stage": "preflop",
                "hole": list(hole), "board": [], "playerCount": players, "trueP": value,
                "answer": answer, "distractor": wrong, "category": "preflop_equity",
                "prompt": f"{players}人での勝率は？",
                "explain": f"この手札の{players}人での勝率は{value:.1f}%です。",
                "difficulty": "hard" if label.endswith("o") or rng.random() < 0.25 else "medium",
                "distractorModel": model, "conceptKey": f"{label}:{players}",
            })
    return questions


def opponent_rank_percent(hole, board, target_rank: str, players: int) -> float:
    known = (*hole, *board)
    remaining_cards = 52 - len(known)
    remaining_targets = 4 - sum(card[0] == target_rank for card in known)
    opponent_cards = (players - 1) * 2
    if remaining_targets == 0:
        return 0.0
    miss = math.comb(remaining_cards - remaining_targets, opponent_cards) / math.comb(remaining_cards, opponent_cards)
    return round((1 - miss) * 100, 2)


def build_mode_d(rng: random.Random) -> list[dict]:
    questions = []
    seen = set()
    stage_counts = D_OPPONENT_RANK_STAGE_COUNTS
    for stage, count in stage_counts.items():
        board_size = {"preflop": 0, "flop": 3, "turn": 4}[stage]
        while sum(question["stage"] == stage for question in questions) < count:
            cards = tuple(rng.sample(DECK, 2 + board_size))
            hole, board = cards[:2], cards[2:]
            target_rank = rng.choice(RANKS)
            players = 2 if len(questions) % 2 == 0 else 6
            key = f"{stage}:{players}:{target_rank}:{canonical_cards([list(hole), list(board)])}"
            if key in seen:
                continue
            value = opponent_rank_percent(hole, board, target_rank, players)
            if value == 0:
                continue
            correct = nearest_bucket(value)
            if players == 6:
                naive = opponent_rank_percent(hole, board, target_rank, 2)
                model = "相手5人分ではなく、1人分だけで考える"
            else:
                visible = sum(card[0] == target_rank for card in (*hole, *board))
                fake_remaining = min(4, 4 - max(0, visible - 1))
                remaining = 52 - len(hole) - len(board)
                naive = (1 - math.comb(remaining - fake_remaining, 2) / math.comb(remaining, 2)) * 100
                model = "見えている同ランクの枚数を1枚少なく数える"
            wrong = spaced_distractor(correct, nearest_bucket(naive))
            if wrong == correct:
                wrong = spaced_distractor(
                    correct,
                    nearest_bucket(correct + (10 if correct < 50 else -10)),
                )
            rank = display_rank(target_rank)
            questions.append({
                "id": f"d-{len(questions) + 1:04d}", "mode": "D", "stage": stage,
                "hole": list(hole), "board": list(board), "targetRank": target_rank,
                "playerCount": players, "trueP": value, "answer": percent_label(correct),
                "distractor": percent_label(wrong), "category": "opponent_rank",
                "prompt": mode_d_copy("opponent_rank", players, target_rank)[0],
                "explain": mode_d_copy("opponent_rank", players, target_rank)[1],
                "difficulty": "hard" if players == 6 or rng.random() < 0.2 else "medium",
                "distractorModel": model, "conceptKey": key,
            })
            seen.add(key)
    return questions


def answer_fields(value: float, model: str) -> dict:
    """Create a readable choice near a concrete misconception."""
    correct = nearest_bucket(value)
    if correct < 5:
        candidates = (0, 1, 2, 3, 5, 7.5)
    elif correct < 20:
        candidates = tuple(bucket for bucket in BUCKETS if abs(bucket - correct) <= 7.5)
    else:
        candidates = tuple(bucket for bucket in BUCKETS if 5 <= abs(bucket - correct) <= 15)
    candidates = tuple(bucket for bucket in candidates if bucket != correct)
    wrong = spaced_distractor(
        correct,
        min(candidates, key=lambda bucket: (abs(bucket - value), abs(bucket - correct))),
    )
    return {
        "trueP": round(value, 2),
        "answer": percent_label(correct),
        "distractor": percent_label(wrong),
        "distractorModel": model,
        "answerType": "percent",
    }


def straight_missing_ranks(cards: tuple[str, ...]) -> set[int]:
    values = {RANK_VALUE[card[0]] for card in cards}
    if 14 in values:
        values.add(1)
    missing = set()
    sequences = ({14, 2, 3, 4, 5}, *(set(range(low, low + 5)) for low in range(2, 11)))
    for sequence in sequences:
        absent = sequence - values
        if len(absent) == 1:
            missing.update(14 if value == 1 else value for value in absent)
    return missing


def has_flush_draw_using_hole(hole: tuple[str, str], board: tuple[str, ...]) -> bool:
    cards = (*hole, *board)
    return not has_flush(cards) and any(
        any(card[1] == suit for card in hole)
        and sum(card[1] == suit for card in cards) == 4
        for suit in SUITS
    )


def new_a_event(
    category: str,
    hole: tuple[str, str],
    start_board: tuple[str, ...],
    final_board: tuple[str, ...],
    target_suit: str | None = None,
) -> bool:
    cards = (*hole, *final_board)
    board_counts = Counter(card[0] for card in final_board)
    if category in {"oesd", "gutshot"}:
        return has_straight_using_hole(hole, final_board)
    if category in {"backdoor_flush", "flush_draw"}:
        return has_flush_using_hole(hole, final_board)
    if category == "board_pair":
        return any(count >= 2 for count in board_counts.values())
    if category == "board_two_pair":
        return sum(count >= 2 for count in board_counts.values()) >= 2
    if category == "overcard":
        pair_value = RANK_VALUE[hole[0][0]]
        return any(RANK_VALUE[card[0]] > pair_value for card in final_board[len(start_board):])
    if category == "four_flush_board":
        return sum(card[1] == target_suit for card in final_board) == 4
    if category == "pocket_pair_counterfeit":
        pair_value = RANK_VALUE[hole[0][0]]
        return pair_value not in evaluate(cards)[1:]
    if category == "two_pair_counterfeit":
        lower = min(RANK_VALUE[hole[0][0]], RANK_VALUE[hole[1][0]])
        return lower not in evaluate(cards)[1:]
    if category == "same_hand_category":
        return evaluate(cards)[0] == evaluate((*hole, *start_board))[0]
    raise ValueError(category)


def exact_new_a_percent(
    category: str,
    hole: tuple[str, str],
    board: tuple[str, ...],
    target_suit: str | None = None,
) -> float:
    remaining = tuple(card for card in DECK if card not in {*hole, *board})
    runouts = tuple(itertools.combinations(remaining, 5 - len(board)))
    hits = sum(
        new_a_event(category, hole, board, (*board, *runout), target_suit)
        for runout in runouts
    )
    return hits / len(runouts) * 100


def build_isolated_straight_draw_state(category: str, rng: random.Random):
    while True:
        stage = rng.choice(("flop", "turn"))
        board_size = 3 if stage == "flop" else 4
        if category == "oesd":
            low = rng.randint(2, 10)
            reverse = {value: rank for rank, value in RANK_VALUE.items()}
            draw_ranks = [reverse[value] for value in range(low, low + 4)]
        else:
            sequence = list(straight_sequence(rng))
            sequence.pop(rng.choice((1, 2, 3)))
            draw_ranks = sequence

        known = tuple(f"{rank}{rng.choice(SUITS)}" for rank in draw_ranks)
        if len(set(known)) != 4:
            continue
        shuffled = list(known)
        rng.shuffle(shuffled)
        hole = tuple(shuffled[:2])
        board_start = tuple(shuffled[2:])
        board = (
            *board_start,
            *draw_cards(rng, board_size - len(board_start), set(known)),
        )
        cards = (*hole, *board)
        if len({card[0] for card in cards}) != len(cards):
            continue
        if has_straight_using_hole(hole, board) or has_flush_draw_using_hole(hole, board):
            continue
        missing = straight_draw_missing_ranks_using_hole(hole, board)
        if category == "oesd" and len(missing) >= 2:
            return stage, hole, board
        if category == "gutshot" and len(missing) == 1:
            return stage, hole, board


def build_new_a_state(category: str, rng: random.Random):
    if category == "backdoor_flush":
        while True:
            suit = rng.choice(SUITS)
            suited = rng.sample([f"{rank}{suit}" for rank in RANKS], 3)
            suited_hole_count = rng.choice((1, 2))
            hole_suited = suited[:suited_hole_count]
            board_suited = suited[suited_hole_count:]
            hole_off = draw_cards(
                rng,
                2 - len(hole_suited),
                set(suited),
            )
            if any(card[1] == suit for card in hole_off):
                continue
            board_off = draw_cards(
                rng,
                3 - len(board_suited),
                set(suited) | set(hole_off),
            )
            if any(card[1] == suit for card in board_off):
                continue
            hole = tuple((*hole_suited, *hole_off))
            board = tuple((*board_suited, *board_off))
            cards = (*hole, *board)
            if len({card[0] for card in cards}) != len(cards):
                continue
            if straight_draw_missing_ranks_using_hole(hole, board):
                continue
            return "flop", hole, board
    if category == "flush_draw":
        while True:
            stage = rng.choice(("flop", "turn"))
            board_size = 3 if stage == "flop" else 4
            suit = rng.choice(SUITS)
            suited = rng.sample([f"{rank}{suit}" for rank in RANKS], 4)
            hole = tuple(suited[:2])
            board_start = tuple(suited[2:])
            fillers = tuple(
                card
                for card in draw_cards(
                    rng,
                    board_size - len(board_start),
                    set(suited),
                )
            )
            if any(card[1] == suit for card in fillers):
                continue
            board = (*board_start, *fillers)
            cards = (*hole, *board)
            if len({card[0] for card in cards}) != len(cards):
                continue
            if straight_draw_missing_ranks_using_hole(hole, board):
                continue
            return stage, hole, board
    if category in {"oesd", "gutshot"}:
        return build_isolated_straight_draw_state(category, rng)
    if category in {"overcard", "pocket_pair_counterfeit"}:
        rank = rng.choice(RANKS[:-1])
        pair = tuple(f"{rank}{suit}" for suit in rng.sample(SUITS, 2))
        stage = rng.choice(("flop", "turn"))
        board = draw_cards(rng, 3 if stage == "flop" else 4, set(pair))
        return stage, pair, board
    if category == "two_pair_counterfeit":
        ranks = rng.sample(RANKS, 2)
        hole = tuple(f"{rank}{rng.choice(SUITS)}" for rank in ranks)
        while hole[0] == hole[1]:
            hole = (hole[0], f"{ranks[1]}{rng.choice(SUITS)}")
        board_start = tuple(f"{rank}{rng.choice([s for s in SUITS if f'{rank}{s}' not in hole])}" for rank in ranks)
        board = (*board_start, *draw_cards(rng, 1, set(hole) | set(board_start)))
        return "flop", hole, board
    stage = rng.choice(("flop", "turn"))
    cards = tuple(rng.sample(DECK, 5 if stage == "flop" else 6))
    return stage, cards[:2], cards[2:]


NEW_A_COPY = {
    "backdoor_flush": (
        "5枚目までにフラッシュができる確率は？",
        "同じマークは今3枚です。残り2枚が両方そのマークなら完成するため、約4.2%です。",
    ),
    "flush_draw": (
        "フラッシュの確率は？",
        "同じマークが今4枚あり、あと1枚で完成するフラッシュドローです。",
    ),
    "oesd": (
        "ストレートの確率は？",
        "並びの両端どちらでも完成する形（OESD）です。",
    ),
    "gutshot": (
        "ストレートの確率は？",
        "並びの内側1種類で完成する形（ガットショット）です。",
    ),
    "board_pair": ("ボードにペアができる確率は？", "ボード上で同じ数字や文字が2枚以上になる可能性です。"),
    "board_two_pair": ("ボードがツーペアになる確率は？", "ボード上で異なる2種類の数字や文字がペアになる可能性です。"),
    "pocket_pair_counterfeit": ("手札のペアが使われなくなる確率は？", "ボードの役が強くなり、ポケットペアがベスト5枚から外れる可能性です。"),
    "two_pair_counterfeit": ("低いペアが使われなくなる確率は？", "ボードの変化で現在のツーペアが弱くなる可能性です。"),
    "same_hand_category": ("今の役のまま終わる確率は？", "役の種類が変わらない可能性です。"),
}


def new_a_copy(
    category: str,
    stage: str,
    hole: tuple[str, ...],
    target_suit: str | None = None,
) -> tuple[str, str]:
    if category == "overcard":
        if len(hole) != 2 or hole[0][0] != hole[1][0]:
            raise ValueError("overcardには手札のペアが必要です")
        pair_rank = hole[0][0]
        next_rank = RANKS[RANKS.index(pair_rank) + 1]
        condition = "A" if next_rank == "A" else f"{display_rank(next_rank)}以上"
        subject = "次のカード" if stage == "turn" else "残り2枚のどちらか"
        return (
            f"{subject}が{condition}の確率は？",
            f"手札は{display_rank(pair_rank)}のペアです。{subject}が{condition}になる可能性です。",
        )
    if category == "four_flush_board":
        suit_name = SUIT_NAMES[target_suit]
        return (
            f"ボードに{suit_name}が4枚になる確率は？",
            f"ボードの{suit_name}が4枚になると、{suit_name}を1枚持つ相手にもフラッシュの可能性があります。",
        )
    return NEW_A_COPY[category]


def build_new_mode_a(rng: random.Random) -> list[dict]:
    questions = []
    seen = set()
    for category, count in NEW_A_COUNTS.items():
        made = 0
        attempts = 0
        while made < count:
            attempts += 1
            if attempts > count * 5000:
                raise RuntimeError(f"A/{category} の生成候補が不足")
            stage, hole, board = build_new_a_state(category, rng)
            if len(set((*hole, *board))) != len(hole) + len(board):
                continue
            target_suit = None
            if category in {"backdoor_flush", "flush_draw"}:
                suit_counts = Counter(card[1] for card in (*hole, *board))
                target_suit = max(suit_counts, key=suit_counts.get)
            elif category == "four_flush_board":
                suit_counts = Counter(card[1] for card in board)
                most_visible = max(suit_counts.values())
                target_suit = rng.choice([
                    suit for suit in SUITS if suit_counts[suit] == most_visible
                ])
            if category != "same_hand_category":
                if new_a_event(category, hole, board, board, target_suit):
                    continue
            value = exact_new_a_percent(category, hole, board, target_suit)
            if not 0 < value < 100:
                continue
            key = f"{category}:{target_suit}:{stage}:{canonical_cards([list(hole), list(board)])}"
            if key in seen:
                continue
            prompt, explain = new_a_copy(category, stage, hole, target_suit)
            if category == "backdoor_flush":
                fields = {
                    "trueP": round(value, 2),
                    "answer": percent_label(nearest_bucket(value)),
                    "distractor": "35%",
                    "distractorModel": "バックドアを通常のフラッシュドローとして数える",
                    "answerType": "percent",
                }
            else:
                fields = answer_fields(
                    value,
                    "残り枚数、重複する組合せ、ボードの変化のどれかを見落とす",
                )
            question = {
                "id": f"a-{LEGACY_MODE_COUNTS['A'] + len(questions) + 1:05d}",
                "mode": "A", "stage": stage, "hole": list(hole), "board": list(board),
                "target": category, "category": category, "prompt": prompt, "explain": explain,
                "difficulty": "hard" if category in {"pocket_pair_counterfeit", "two_pair_counterfeit"} or rng.random() < .2 else "medium",
                "conceptKey": key, **fields,
            }
            if target_suit:
                question["targetSuit"] = target_suit
            questions.append(question)
            seen.add(key)
            made += 1
    return questions


def outcome_percent(hands, board, predicate) -> float:
    known = {card for hand in hands for card in hand} | set(board)
    remaining = tuple(card for card in DECK if card not in known)
    runout_count = 5 - len(board)
    total = hits = 0
    for runout in itertools.combinations(remaining, runout_count):
        final_board = (*board, *runout)
        scores = [evaluate((*hand, *final_board)) for hand in hands]
        hits += predicate(scores, final_board, runout)
        total += 1
    return hits / total * 100


def mode_b_copy(category: str, leader: int | None = None) -> tuple[str, str, int | None]:
    if category in {"trailing_hand_wins", "leading_hand_holds"}:
        if leader not in {0, 1}:
            raise ValueError(f"左右を特定できません: {category}")
        target_hand = leader if category == "leading_hand_holds" else 1 - leader
        if target_hand != 1:
            raise ValueError(f"勝率問題の対象が右に配置されていません: {category}")
        current_state = "強く、そのまま最後まで勝つ" if category == "leading_hand_holds" else "弱く、最後に逆転して勝つ"
        return (
            "右の手札の勝率は？",
            f"今は右の手札が{current_state}可能性です。",
            target_hand,
        )
    raise ValueError(f"未対応のモードBカテゴリです: {category}")


def build_new_mode_b(rng: random.Random) -> list[dict]:
    questions = []
    seen = set()
    for category, count in NEW_B_COUNTS.items():
        made = 0
        attempts = 0
        while made < count:
            attempts += 1
            if attempts > count * 4000:
                raise RuntimeError(f"B/{category} の生成候補が不足")
            stage = rng.choice(("flop", "turn"))
            board_size = 3 if stage == "flop" else 4
            cards = tuple(rng.sample(DECK, 4 + board_size))
            hands = (cards[:2], cards[2:4])
            board = cards[4:]
            reasons = tuple(continuation_reasons(hand, board) for hand in hands)
            if not all(reasons):
                continue
            archetype = comparison_archetype(hands, board, reasons)
            current = [evaluate((*hand, *board)) for hand in hands]
            leader = 0 if current[0] > current[1] else 1 if current[1] > current[0] else None
            if category in {"trailing_hand_wins", "leading_hand_holds"} and leader is None:
                continue
            if category in {"trailing_hand_wins", "leading_hand_holds"}:
                target_hand = leader if category == "leading_hand_holds" else 1 - leader
                if target_hand == 0:
                    hands = (hands[1], hands[0])
                    current = [current[1], current[0]]
                    reasons = (reasons[1], reasons[0])
                    archetype = comparison_archetype(hands, board, reasons)
                    leader = 1 - leader
            trailer = None if leader is None else 1 - leader

            def predicate(scores, final_board, runout):
                if category == "trailing_hand_wins":
                    return scores[trailer] > scores[leader]
                if category == "leading_hand_holds":
                    return scores[leader] > scores[trailer]
                raise ValueError(category)

            value = outcome_percent(hands, board, predicate)
            if not 5 <= value <= 95:
                continue
            key = f"{category}:{stage}:{canonical_cards([list(hands[0]), list(hands[1]), list(board)])}"
            if key in seen:
                continue
            prompt, explain, target_hand = mode_b_copy(category, leader)
            fields = answer_fields(value, "引き分け、逆転、再逆転の組合せの一部を数え落とす")
            question = {
                "id": f"b-{LEGACY_MODE_COUNTS['B'] + len(questions) + 1:05d}",
                "mode": "B", "stage": stage, "hands": [list(hand) for hand in hands],
                "board": list(board), "category": category, "prompt": prompt, "explain": explain,
                "difficulty": "hard" if category not in {"leading_hand_holds", "trailing_hand_wins"} or rng.random() < .2 else "medium",
                "archetype": archetype,
                "continuationReasons": [list(reason) for reason in reasons],
                "conceptKey": key, **fields,
            }
            if target_hand is not None:
                question["targetHand"] = target_hand
            questions.append(question)
            seen.add(key)
            made += 1
    return questions


def postflop_equity(hole, board, players, rng, trials=30_000):
    known = set((*hole, *board))
    deck = [card for card in DECK if card not in known]
    score = 0.0
    deal_count = (players - 1) * 2 + 5 - len(board)
    for _ in range(trials):
        dealt = rng.sample(deck, deal_count)
        opponents = [tuple(dealt[index:index + 2]) for index in range(0, (players - 1) * 2, 2)]
        runout = tuple(dealt[(players - 1) * 2:])
        final_board = (*board, *runout)
        scores = [evaluate((*hole, *final_board)), *(evaluate((*hand, *final_board)) for hand in opponents)]
        if scores[0] == max(scores):
            score += 1 / scores.count(scores[0])
    return round(score / trials * 100, 2)


def postflop_equity_task(args):
    hole, board, players, seed = args
    return postflop_equity(hole, board, players, random.Random(seed))


def build_new_mode_c(rng: random.Random) -> list[dict]:
    entries = []
    seen = set()
    for players in (2, 6):
        while sum(entry[2] == players for entry in entries) < C_POSTFLOP_PER_PLAYER:
            stage = "flop" if sum(entry[2] == players for entry in entries) % 2 == 0 else "turn"
            cards = tuple(rng.sample(DECK, 5 if stage == "flop" else 6))
            hole, board = cards[:2], cards[2:]
            key = f"postflop_equity:{players}:{stage}:{canonical_cards([list(hole), list(board)])}"
            if key in seen:
                continue
            seen.add(key)
            entries.append((hole, board, players, stage, key))
    tasks = [(hole, board, players, 2026081200 + index) for index, (hole, board, players, _stage, _key) in enumerate(entries)]
    questions = []
    with ProcessPoolExecutor() as executor:
        values = executor.map(postflop_equity_task, tasks)
        for (hole, board, players, stage, key), value in zip(entries, values, strict=True):
            fields = answer_fields(value, "現在の完成役だけを見て、残りカードや相手人数を過大または過小評価する")
            questions.append({
                "id": f"c-{LEGACY_MODE_COUNTS['C'] + len(questions) + 1:04d}",
                "mode": "C", "stage": stage, "hole": list(hole), "board": list(board),
                "playerCount": players, "category": "postflop_equity", "prompt": f"{players}人での勝率は？",
                "explain": f"この状況での{players}人での勝率は{value:.1f}%です。",
                "difficulty": "hard" if players == 6 or rng.random() < .25 else "medium",
                "conceptKey": key, **fields,
            })
    return questions


def opponent_draw_kind(hand, board):
    cards = (*hand, *board)
    if has_straight_using_hole(hand, board):
        return None
    missing = straight_missing_ranks(cards)
    if len(missing) >= 2:
        return "oesd"
    if len(missing) == 1:
        return "gutshot"
    return None


def opponent_matches(category, hand, hero, board, target_rank=None):
    board_ranks = {card[0] for card in board}
    if category == "opponent_pocket_pair":
        return hand[0][0] == hand[1][0]
    if category in {"exactly_one_opponent_target_rank", "multiple_opponents_target_rank"}:
        return any(card[0] == target_rank for card in hand)
    score = evaluate((*hand, *board))
    if category == "opponent_overpair":
        return bool(board) and hand[0][0] == hand[1][0] and RANK_VALUE[hand[0][0]] > max(RANK_VALUE[card[0]] for card in board)
    if category == "opponent_set":
        return bool(board) and hand[0][0] == hand[1][0] and sum(card[0] == hand[0][0] for card in board) == 1
    if category == "opponent_top_pair_plus":
        top = max((RANK_VALUE[card[0]] for card in board), default=99)
        return any(RANK_VALUE[card[0]] == top for card in hand) and score[0] >= 1
    if category == "opponent_two_pair":
        return score[0] == 2 and bool({card[0] for card in hand} & board_ranks)
    if category in {
        "opponent_straight_three_connected_board",
        "opponent_straight_four_connected_board",
    }:
        return has_straight_using_hole(hand, board)
    if category == "opponent_straight":
        return score[0] == 4 and has_straight_using_hole(hand, board)
    if category in {
        "opponent_flush_three_suited_board",
        "opponent_flush_four_suited_board",
    }:
        return has_flush_using_hole(hand, board)
    if category == "opponent_flush":
        return score[0] == 5 and has_flush_using_hole(hand, board)
    if category == "opponent_flush_draw":
        return has_flush_draw_using_hole(hand, board)
    if category == "opponent_combo_draw":
        return has_flush_draw_using_hole(hand, board) and opponent_draw_kind(hand, board) is not None
    if category == "opponent_higher_flush":
        hero_score = evaluate((*hero, *board))
        return hero_score[0] == 5 and score[0] == 5 and score > hero_score and has_flush_using_hole(hand, board)
    if category == "opponent_same_pair_higher_kicker":
        hero_score = evaluate((*hero, *board))
        return hero_score[0] == score[0] == 1 and hero_score[1] == score[1] and score > hero_score
    if category == "all_opponents_miss_board":
        return not ({card[0] for card in hand} & board_ranks)
    raise ValueError(category)


def opponent_property_percent(category, hero, board, target_rank, players, rng):
    deck = [card for card in DECK if card not in {*hero, *board}]
    aggregate_all = category == "all_opponents_miss_board"
    exact_one = category == "exactly_one_opponent_target_rank"
    multiple = category == "multiple_opponents_target_rank"
    if players == 2:
        hands = itertools.combinations(deck, 2)
        results = [opponent_matches(category, hand, hero, board, target_rank) for hand in hands]
        return sum(results) / len(results) * 100
    if category in BOARD_THREAT_CATEGORIES:
        return exact_board_threat_percent(category, tuple(deck), board, players - 1)
    hits = 0
    trials = 5000
    for _ in range(trials):
        dealt = rng.sample(deck, 10)
        hands = [tuple(dealt[index:index + 2]) for index in range(0, 10, 2)]
        matches = [opponent_matches(category, hand, hero, board, target_rank) for hand in hands]
        if aggregate_all:
            hit = all(matches)
        elif exact_one:
            hit = sum(matches) == 1
        elif multiple:
            hit = sum(matches) >= 2
        else:
            hit = any(matches)
        hits += hit
    return hits / trials * 100


def exact_board_threat_percent(
    category: str,
    deck: tuple[str, ...],
    board: tuple[str, ...],
    opponents: int,
) -> float:
    """Calculate the exact chance that any opponent has the board-made threat."""
    board_ranks = {card[0] for card in board}
    bad_label_pairs: set[frozenset[str]] = set()

    if "straight" in category:
        missing_sets = {
            frozenset(set(sequence) - board_ranks)
            for sequence in STRAIGHT_SEQUENCES
            if board_ranks <= set(sequence)
            and len(set(sequence) - board_ranks) <= 2
        }
        relevant_ranks = set().union(*missing_sets)
        labels = tuple(card[0] if card[0] in relevant_ranks else "other" for card in deck)
        for missing in missing_sets:
            if len(missing) == 1:
                rank = next(iter(missing))
                bad_label_pairs.update(
                    (
                        frozenset((rank,)),
                        *(frozenset((rank, other)) for other in relevant_ranks if other != rank),
                        frozenset((rank, "other")),
                    )
                )
            else:
                bad_label_pairs.add(missing)
    else:
        target_suit = board[0][1]
        labels = tuple("target" if card[1] == target_suit else "other" for card in deck)
        if len(board) == 3:
            bad_label_pairs.add(frozenset(("target",)))
        else:
            bad_label_pairs.update(
                (frozenset(("target",)), frozenset(("target", "other")))
            )

    label_counts = Counter(labels)
    ordered_labels = tuple(sorted(label_counts))
    label_indexes = {label: index for index, label in enumerate(ordered_labels)}
    bad_index_pairs = tuple(
        sorted(
            tuple(sorted(label_indexes[label] for label in pair))
            for pair in bad_label_pairs
        )
    )
    no_match = deal_without_bad_pair_probability(
        tuple(label_counts[label] for label in ordered_labels),
        bad_index_pairs,
        opponents,
    )
    return (1 - no_match) * 100


@lru_cache(maxsize=None)
def deal_without_bad_pair_probability(
    counts: tuple[int, ...],
    bad_pairs: tuple[tuple[int, ...], ...],
    hands_left: int,
) -> float:
    """Deal unordered two-card hands and return the exact no-match probability."""
    if hands_left == 0:
        return 1.0
    total_cards = sum(counts)
    total_pairs = math.comb(total_cards, 2)
    bad = set(bad_pairs)
    probability = 0.0
    for left, left_count in enumerate(counts):
        if left_count == 0:
            continue
        for right in range(left, len(counts)):
            right_count = counts[right]
            ways = (
                math.comb(left_count, 2)
                if left == right
                else left_count * right_count
            )
            if ways == 0:
                continue
            pair = (left,) if left == right else (left, right)
            if pair in bad:
                continue
            remaining = list(counts)
            remaining[left] -= 1
            remaining[right] -= 1
            probability += (
                ways
                / total_pairs
                * deal_without_bad_pair_probability(
                    tuple(remaining), bad_pairs, hands_left - 1
                )
            )
    return probability


MODE_D_BEGINNER_COPY = {
    "opponent_pocket_pair": (
        "の手札がペアの確率は？",
        "相手の手札2枚が同じ数字・文字の組合せです。この手札をポケットペアと呼びます。",
    ),
    "opponent_overpair": (
        "がボードより高いペアの確率は？",
        "手札のペアがボードの一番高いカードよりも高い形を、オーバーペアと呼びます。",
    ),
    "opponent_set": (
        "が手札のペアでスリーの確率は？",
        "手札2枚がペアで、ボードに同じ数字・文字が1枚あるスリーをセットと呼びます。",
    ),
    "opponent_two_pair": (
        "がツーペアの確率は？",
        "相手の2枚と現在のボードから、異なる2組のペアができる組合せです。",
    ),
    "opponent_straight": (
        "がストレートの確率は？",
        "相手の2枚と現在のボードから、連続する5枚ができる組合せです。",
    ),
    "opponent_flush": (
        "がフラッシュの確率は？",
        "相手の2枚と現在のボードから、同じマークが5枚できる組合せです。",
    ),
    "opponent_straight_three_connected_board": (
        "がストレートの確率は？",
        "3枚の連番だけではストレートになりません。不足する2種類を同じ相手が持つ組合せです。フォールド傾向は含まない純粋なカード確率です。",
    ),
    "opponent_straight_four_connected_board": (
        "がストレートの確率は？",
        "4枚の連番につながる端のカードを、相手が1枚以上持つ組合せです。フォールド傾向は含まない純粋なカード確率です。",
    ),
    "opponent_flush_three_suited_board": (
        "がフラッシュの確率は？",
        "ボードと同じマークを2枚とも持つ相手がいる組合せです。",
    ),
    "opponent_flush_four_suited_board": (
        "がフラッシュの確率は？",
        "ボードと同じマークを1枚以上持つ相手がいる組合せです。",
    ),
    "opponent_flush_draw": (
        "があと1枚でフラッシュの確率は？",
        "同じマークが現在4枚あり、あと1枚でフラッシュになる形です。一般にフラッシュドローと呼びます。",
    ),
    "opponent_combo_draw": (
        "がストレートとフラッシュ待ちの確率は？",
        "ストレートとフラッシュの両方を狙える形です。一般にコンボドローと呼びます。",
    ),
    "opponent_higher_flush": (
        "が自分より高いフラッシュの確率は？",
        "自分と同じマークで、より高いカードを含むフラッシュの組合せです。",
    ),
    "opponent_same_pair_higher_kicker": (
        "が同じペアで自分より強い確率は？",
        "同じペア同士では、ペア以外の高いカードで勝敗を比べます。そのカードをキッカーと呼びます。",
    ),
}


def mode_d_copy(
    category: str,
    players: int,
    target_rank: str | None = None,
    board: tuple[str, ...] = (),
) -> tuple[str, str]:
    table = f"{players}人卓で"
    subject = "相手" if players == 2 else "ほかの誰か"

    if category == "opponent_rank":
        rank = display_rank(target_rank)
        return (
            f"{table}{subject}が{rank}を持つ確率は？",
            f"見えていない{rank}と、相手に配られる枚数から考えます。",
        )
    if category == "all_opponents_miss_board":
        all_opponents = "相手" if players == 2 else "相手全員"
        return (
            f"{table}{all_opponents}がボードとペアでない確率は？",
            "相手の手札に、ボードと同じ数字・文字が1枚もない可能性です。",
        )
    if category == "opponent_top_pair_plus":
        top_rank = max(board, key=lambda card: RANK_VALUE[card[0]])[0]
        rank = display_rank(top_rank)
        return (
            f"{table}{subject}が{rank}を持つ確率は？",
            f"{rank}はボードで一番強いカードです。相手が{rank}を持つ組合せを考えます。",
        )
    if category.endswith("target_rank"):
        rank = display_rank(target_rank)
        if players == 2:
            return (
                f"{table}相手が{rank}を持つ確率は？",
                f"見えていない{rank}が、相手に配られる可能性です。",
            )
        amount = "1人だけ" if category.startswith("exactly") else "2人以上"
        return (
            f"{table}{rank}を持つ相手が{amount}の確率は？",
            f"見えていない{rank}が、何人の相手に配られるかを考えます。",
        )

    prompt_tail, explanation = MODE_D_BEGINNER_COPY[category]
    return f"{table}{subject}{prompt_tail}", explanation


def build_new_d_state(category, rng):
    if category in {
        "opponent_pocket_pair",
        "exactly_one_opponent_target_rank",
        "multiple_opponents_target_rank",
    }:
        return "preflop", tuple(rng.sample(DECK, 2)), ()
    if category in BOARD_THREAT_CATEGORIES:
        if "straight" in category:
            connected_count = 3 if "three" in category else 4
            sequence = rng.choice(STRAIGHT_SEQUENCES)
            start = rng.randrange(0, len(sequence) - connected_count + 1)
            board_ranks = sequence[start:start + connected_count]
            board = tuple(
                f"{rank}{suit}"
                for rank, suit in zip(board_ranks, rng.sample(SUITS, connected_count), strict=True)
            )
        else:
            suited_count = 3 if "three" in category else 4
            suit = rng.choice(SUITS)
            board = tuple(
                f"{rank}{suit}" for rank in rng.sample(tuple(RANKS), suited_count)
            )
        hero = tuple(rng.sample([card for card in DECK if card not in board], 2))
        return ("flop" if len(board) == 3 else "turn"), hero, board
    stage = rng.choice(("flop", "turn"))
    board_size = 3 if stage == "flop" else 4
    if category == "opponent_higher_flush":
        suit = rng.choice(SUITS)
        board = tuple(rng.sample([f"{rank}{suit}" for rank in RANKS[2:]], 3))
        hero = tuple(rng.sample([f"{rank}{suit}" for rank in RANKS[:8] if f"{rank}{suit}" not in board], 2))
        if stage == "turn":
            board = (*board, rng.choice([card for card in DECK if card not in {*hero, *board} and card[1] != suit]))
        return stage, hero, board
    if category == "opponent_same_pair_higher_kicker":
        rank = rng.choice(RANKS[3:10])
        board_card = f"{rank}{rng.choice(SUITS)}"
        hero_match = f"{rank}{rng.choice([s for s in SUITS if f'{rank}{s}' != board_card])}"
        hero = (hero_match, rng.choice([card for card in DECK if card not in {board_card, hero_match} and RANK_VALUE[card[0]] < RANK_VALUE[rank]]))
        board = (board_card, *draw_cards(rng, board_size - 1, set(hero) | {board_card}))
        return stage, hero, board
    cards = tuple(rng.sample(DECK, 2 + board_size))
    return stage, cards[:2], cards[2:]


def build_new_mode_d(
    rng: random.Random,
    category_counts: dict[str, int] | None = None,
    existing_count: int = 0,
) -> list[dict]:
    questions = []
    seen = set()
    counts = NEW_D_COUNTS if category_counts is None else category_counts
    for category, count in counts.items():
        made = 0
        attempts = 0
        while made < count:
            attempts += 1
            if attempts > count * 3000:
                raise RuntimeError(f"D/{category} の生成候補が不足")
            stage, hole, board = build_new_d_state(category, rng)
            players = (
                6
                if category == "multiple_opponents_target_rank"
                or category in BOARD_THREAT_CATEGORIES
                else 2 if made % 2 == 0 else 6
            )
            target_rank = rng.choice(RANKS) if category.endswith("target_rank") else None
            value = opponent_property_percent(category, hole, board, target_rank, players, rng)
            if not 0.5 <= value <= 99.5:
                continue
            key = f"{category}:{players}:{target_rank}:{stage}:{canonical_cards([list(hole), list(board)])}"
            if key in seen:
                continue
            prompt, explain = mode_d_copy(category, players, target_rank, board)
            distractor_model = (
                "1人分の確率をそのまま使う、または相手5人分を単純に5倍する"
                if category in BOARD_THREAT_CATEGORIES
                else "相手人数、見えているカード、ボードだけの役のいずれかを数え違える"
            )
            fields = answer_fields(value, distractor_model)
            question = {
                "id": f"d-{LEGACY_MODE_COUNTS['D'] + existing_count + len(questions) + 1:04d}",
                "mode": "D", "stage": stage, "hole": list(hole), "board": list(board),
                "playerCount": players, "category": category, "prompt": prompt, "explain": explain,
                "difficulty": "medium" if category in BOARD_THREAT_CATEGORIES else "hard" if players == 6 or category in {"opponent_combo_draw", "opponent_higher_flush", "opponent_same_pair_higher_kicker"} else "medium",
                "conceptKey": key, **fields,
            }
            if target_rank:
                question["targetRank"] = target_rank
            questions.append(question)
            seen.add(key)
            made += 1
        print(f"  D/{category}: {made}問", flush=True)
    return questions


BANNED_EXPLANATION_WORDS = (
    "アウツ",
    "ターン",
    "リバー",
    "OESD",
    "厳密には",
)


def validate_explanation_copy(question: dict) -> None:
    """解説文が初心者向けの表記ルールと実際の数値に沿っているかを検証します。"""
    explain = question["explain"]
    question_id = question["id"]
    for word in BANNED_EXPLANATION_WORDS:
        if word in explain:
            raise RuntimeError(
                f"解説に初心者向けでない語「{word}」が含まれます: {question_id}"
            )
    if (
        question["mode"] == "B"
        and question["category"] == "hand_comparison"
        and not question["board"]
        and "スターティングハンド勝率表" in explain
    ):
        raise RuntimeError(
            f"2ハンドの直接対決を6人卓の勝率表へ案内しています: {question_id}"
        )
    if re.search(r"\d×4＝", explain) and "約4%" not in explain:
        raise RuntimeError(
            f"×4の前に1枚あたりの確率を示していません: {question_id}"
        )
    if re.search(r"\d×2＝", explain) and "約2%" not in explain:
        raise RuntimeError(
            f"×2の前に1枚あたりの確率を示していません: {question_id}"
        )
    if question["mode"] == "B" and question["category"] in {
        "trailing_hand_wins",
        "leading_hand_holds",
    }:
        hands = tuple(tuple(hand) for hand in question["hands"])
        board = tuple(question["board"])
        result = enumerate_runouts(hands, board, 1)
        stated = re.findall(r"約([\d.]+)%", explain)
        if not stated:
            raise RuntimeError(f"勝率を示していない解説です: {question_id}")
        actual = 100 * len(result["wins"]) / result["total"]
        if abs(float(stated[-1]) - actual) > 0.15:
            raise RuntimeError(
                f"解説の勝率が実際の列挙結果と一致しません: {question_id} "
                f"（解説={stated[-1]}%, 実測={actual:.1f}%）"
            )
        if question["stage"] == "flop":
            if "残り2枚の組合せ" in explain or re.search(r"\d+通り", explain):
                raise RuntimeError(
                    f"暗算できない全組合せの件数を解説へ出しています: {question_id}"
                )
            if "見積もります" not in explain:
                raise RuntimeError(
                    f"暗算用の見積もり方を示していない解説です: {question_id}"
                )


def validate(bank: list[dict]) -> None:
    expected_total = sum(MODE_COUNTS.values())
    if len(bank) != expected_total:
        raise RuntimeError(
            f"問題数が正本の{expected_total:,}問ではありません: {len(bank):,}"
        )
    mode_counts = Counter(question["mode"] for question in bank)
    if dict(mode_counts) != MODE_COUNTS:
        raise RuntimeError(f"モード比率が不正です: {mode_counts}")
    expected_category_counts = {
        (mode, category): count
        for mode, categories in QUESTION_PATTERN_COUNTS.items()
        for category, count in categories.items()
    }
    category_counts = Counter(
        (question["mode"], question["category"]) for question in bank
    )
    if dict(category_counts) != expected_category_counts:
        raise RuntimeError(
            "カテゴリ内訳が正本と一致しません: "
            f"期待={expected_category_counts}, 実際={dict(category_counts)}"
        )
    if len({question["id"] for question in bank}) != len(bank):
        raise RuntimeError("問題IDが重複しています")
    if len({question["conceptKey"] for question in bank}) != len(bank):
        raise RuntimeError("スート同型を含む問題構造が重複しています")
    for question in bank:
        pattern = PATTERN_BY_KEY.get(
            f"{question.get('mode')}:{question.get('category')}"
        )
        if pattern is None:
            raise RuntimeError(f"正本にないカテゴリです: {question['id']}")
        if question.get("answerType") != pattern["answer_type"]:
            raise RuntimeError(f"回答形式が正本と不一致です: {question['id']}")
        if question.get("stage") not in pattern["stages"]:
            raise RuntimeError(f"ステージが正本と不一致です: {question['id']}")
        if "players" in pattern and question.get("playerCount") not in pattern["players"]:
            raise RuntimeError(f"卓人数が正本と不一致です: {question['id']}")
        if question.get("level") != expected_question_level(question):
            raise RuntimeError(f"対象者レベルが正本と不一致です: {question['id']}")
        if question.get("category") in {
            "nut_flush",
            "same_final_category",
            "clean_out",
            "next_card_reversal",
            "runner_straight",
            "runner_flush",
            "runner_flush_or_straight",
            "tie_probability",
            "board_straight_chop",
            "board_flush_chop",
        }:
            raise RuntimeError(f"廃止した問題カテゴリです: {question['id']}")
        if question.get("trueP") == 0:
            raise RuntimeError(f"0%問題です: {question['id']}")
        if question.get("level") not in {"beginner", "intermediate", "advanced"}:
            raise RuntimeError(f"対象者レベルが不正です: {question['id']}")
        cards = question.get("hole", []) + question.get("board", [])
        cards += [card for hand in question.get("hands", []) for card in hand]
        if len(cards) != len(set(cards)):
            raise RuntimeError(f"カード重複: {question['id']}")
        if not question.get("distractorModel"):
            raise RuntimeError(f"誤答理由なし: {question['id']}")
        if question.get("answerType") == "percent" and question["answer"] == question["distractor"]:
            raise RuntimeError(f"選択肢重複: {question['id']}")
        if "スート" in f"{question['prompt']}{question['explain']}":
            raise RuntimeError(f"初心者向けでない表示文言: {question['id']}")
        if "ランク" in f"{question['prompt']}{question['explain']}":
            raise RuntimeError(f"初心者向けでない表示文言: {question['id']}")
        if "ランナーランナー" in f"{question['prompt']}{question['explain']}":
            raise RuntimeError(f"廃止したバックドア表現です: {question['id']}")
        validate_explanation_copy(question)
        if question.get("answerType") == "percent":
            correct = float(question["answer"].removesuffix("%"))
            wrong = float(question["distractor"].removesuffix("%"))
            if correct not in BUCKETS or wrong not in BUCKETS:
                raise RuntimeError(f"選択肢の刻みが不正です: {question['id']}")
            if correct != nearest_bucket(question["trueP"]):
                raise RuntimeError(f"正解選択肢が実際の値に最も近くありません: {question['id']}")
            if abs(correct - wrong) < minimum_choice_gap(correct):
                raise RuntimeError(f"選択肢が近すぎます: {question['id']}")
        if question.get("category") in {"trailing_hand_wins", "leading_hand_holds"}:
            hands = tuple(tuple(hand) for hand in question["hands"])
            board = tuple(question["board"])
            current = [evaluate((*hand, *board)) for hand in hands]
            if current[0] == current[1]:
                raise RuntimeError(f"左右を特定できない勝率問題です: {question['id']}")
            leader = 0 if current[0] > current[1] else 1
            expected_target = leader if question["category"] == "leading_hand_holds" else 1 - leader
            if expected_target != 1 or question.get("targetHand") != 1:
                raise RuntimeError(f"勝率の対象手札が不正です: {question['id']}")
            if question["prompt"] != "右の手札の勝率は？":
                raise RuntimeError(f"勝率の対象が問題文と不一致です: {question['id']}")
            if not 5 <= question["trueP"] <= 95:
                raise RuntimeError(f"実戦価値の低い極端な勝率です: {question['id']}")
        if question["mode"] == "B":
            hands = tuple(tuple(hand) for hand in question["hands"])
            board = tuple(question["board"])
            reasons = tuple(continuation_reasons(hand, board) for hand in hands)
            if not all(reasons):
                raise RuntimeError(f"続行理由のない手札比較です: {question['id']}")
            expected_reasons = [list(reason) for reason in reasons]
            if question.get("continuationReasons") != expected_reasons:
                raise RuntimeError(f"続行理由が不一致です: {question['id']}")
            if question.get("archetype") != comparison_archetype(hands, board, reasons):
                raise RuntimeError(f"対決類型が不一致です: {question['id']}")
            if not board and is_obvious_preflop_comparison(hands):
                raise RuntimeError(f"差が明白なプリフロップ比較です: {question['id']}")
            if not board and max(question["equities"]) < 51:
                raise RuntimeError(f"勝率差が小さすぎるプリフロップ比較です: {question['id']}")
            if not board and question.get("simulationTrials") != 12_000:
                raise RuntimeError(f"プリフロップ比較の試行数が不正です: {question['id']}")
        if question.get("category") == "backdoor_flush":
            hole = tuple(question["hole"])
            board = tuple(question["board"])
            target_suit = question.get("targetSuit")
            if question["stage"] != "flop" or target_suit not in SUITS:
                raise RuntimeError(f"バックドアフラッシュの状態が不正です: {question['id']}")
            if sum(card[1] == target_suit for card in (*hole, *board)) != 3:
                raise RuntimeError(f"同じマークが3枚ではありません: {question['id']}")
            if not any(card[1] == target_suit for card in hole):
                raise RuntimeError(f"手札のマークを使わないバックドアです: {question['id']}")
            if straight_draw_missing_ranks_using_hole(hole, board):
                raise RuntimeError(f"ストレート待ちを併設したバックドアです: {question['id']}")
            remaining = tuple(card for card in DECK if card not in {*hole, *board})
            if any(has_flush_using_hole(hole, (*board, card)) for card in remaining):
                raise RuntimeError(f"1枚で完成する通常ドローです: {question['id']}")
            if question["trueP"] != 4.16 or question["answer"] != "5%" or question["distractor"] != "35%":
                raise RuntimeError(f"バックドアフラッシュの確率・選択肢が不正です: {question['id']}")
        if question.get("category") in {"flush", "straight"}:
            hole = tuple(question["hole"])
            board = tuple(question["board"])
            remaining = tuple(card for card in DECK if card not in {*hole, *board})
            completes_with_one = any(
                (
                    has_flush_using_hole(hole, (*board, card))
                    if question["category"] == "flush"
                    else has_straight_using_hole(hole, (*board, card))
                )
                for card in remaining
            )
            if not completes_with_one:
                raise RuntimeError(f"通常カテゴリにバックドアが混入しています: {question['id']}")
        if question.get("category") == "four_flush_board":
            target_suit = question.get("targetSuit")
            if target_suit not in SUITS:
                raise RuntimeError(f"対象マークが不正です: {question['id']}")
            expected = round(
                exact_new_a_percent(
                    question["category"],
                    tuple(question["hole"]),
                    tuple(question["board"]),
                    target_suit,
                ),
                2,
            )
            if question["trueP"] != expected:
                raise RuntimeError(f"ボード4枚の確率が不正です: {question['id']}")
        if question.get("category") in BOARD_THREAT_CATEGORIES:
            validate_board_threat_question(question)
        if question["mode"] == "D" and not question["prompt"].startswith(f"{question['playerCount']}人卓で"):
            raise RuntimeError(f"卓人数なし: {question['id']}")


def validate_board_threat_question(question: dict) -> None:
    category = question["category"]
    board = tuple(question["board"])
    expected_stage = "flop" if "three" in category else "turn"
    expected_count = 3 if "three" in category else 4
    if question["playerCount"] != 6 or question["stage"] != expected_stage:
        raise RuntimeError(f"危険ボードの卓人数・ステージが不正です: {question['id']}")
    if len(board) != expected_count:
        raise RuntimeError(f"危険ボードの枚数が不正です: {question['id']}")
    if "straight" in category:
        ranks = {card[0] for card in board}
        if not any(
            ranks <= set(sequence)
            and any(set(sequence[index:index + expected_count]) == ranks for index in range(6 - expected_count))
            for sequence in STRAIGHT_SEQUENCES
        ):
            raise RuntimeError(f"ボードが連番ではありません: {question['id']}")
    elif len({card[1] for card in board}) != 1:
        raise RuntimeError(f"ボードのマークがそろっていません: {question['id']}")
    expected = round(
        opponent_property_percent(
            category,
            tuple(question["hole"]),
            board,
            None,
            6,
            random.Random(0),
        ),
        2,
    )
    if question["trueP"] != expected:
        raise RuntimeError(f"危険ボードの確率が不正です: {question['id']}")


def expected_question_level(question: dict) -> str:
    if question["mode"] == "B":
        pattern = PATTERN_BY_KEY[f"B:{question['category']}"]
        if pattern["level_rule"] == "b_archetype":
            return (
                "beginner"
                if question.get("archetype") in B_BEGINNER_ARCHETYPES
                else "intermediate"
            )
    pattern = PATTERN_BY_KEY[f"{question['mode']}:{question['category']}"]
    if pattern["level_rule"] == "fixed":
        return pattern["level"]
    if pattern["level_rule"] == "players":
        return pattern["levels_by_players"][question["playerCount"]]
    raise RuntimeError(f"対象者レベルを決められません: {question['id']}")


def normalize_question_level(question: dict) -> None:
    question["level"] = expected_question_level(question)


def format_rank_values(values: set[int] | tuple[int, ...] | list[int]) -> str:
    reverse = {value: rank for rank, value in RANK_VALUE.items()}
    return "・".join(
        display_rank(reverse[value]) for value in sorted(set(values))
    )


def remaining_cards_for(*groups: tuple[str, ...]) -> tuple[str, ...]:
    known = {card for group in groups for card in group}
    return tuple(card for card in DECK if card not in known)


def outs_approximation(stage: str, outs: int, count_explanation: str) -> str:
    """1枚あたりの確率を示してから枚数×確率の概算に進む解説を作ります。"""
    multiplier = 4 if stage == "flop" else 2
    if outs * multiplier >= 100:
        raise ValueError(
            f"枚数×確率の概算を使えない大きな当たり枚数です: {outs}"
        )
    if stage == "flop":
        unit = "あと2枚めくれるので、特定の1枚が来る確率は約4%。"
    else:
        unit = "あと1枚しかめくれないので、1枚あたり約2%。"
    explanation = f"{count_explanation}{unit}{outs}×{multiplier}＝約{outs * multiplier}%です。"
    if stage == "flop" and outs >= 10:
        explanation += (
            "ただしこの足し算は、4枚目と5枚目の両方が当たりだった場合を"
            "二重に数えてしまいます。当たりが多いほどそのズレは大きくなります。"
        )
    return explanation


def simple_completion_outs(question: dict) -> tuple[str, ...]:
    hole = tuple(question["hole"])
    board = tuple(question["board"])
    category = question["category"]
    return tuple(
        card
        for card in remaining_cards_for(hole, board)
        if target_complete(
            hole,
            (*board, card),
            category,
            question.get("targetRank"),
        )
    )


def new_a_completion_outs(question: dict) -> tuple[str, ...]:
    hole = tuple(question["hole"])
    board = tuple(question["board"])
    category = question["category"]
    return tuple(
        card
        for card in remaining_cards_for(hole, board)
        if new_a_event(
            category,
            hole,
            board,
            (*board, card),
            question.get("targetSuit"),
        )
    )


def mode_a_learning_explanation(question: dict) -> str:
    category = question["category"]
    stage = question["stage"]
    hole = tuple(question["hole"])
    board = tuple(question["board"])
    known = (*hole, *board)

    if category in {"flush", "flush_draw"}:
        if category == "flush_draw":
            target_suit = question["targetSuit"]
            outs = len(new_a_completion_outs(question))
        else:
            suit_counts = Counter(card[1] for card in known)
            target_suit = next(
                suit
                for suit, count in suit_counts.items()
                if count == 4 and any(card[1] == suit for card in hole)
            )
            outs = len(simple_completion_outs(question))
        suit_name = SUIT_NAMES[target_suit]
        return outs_approximation(
            stage,
            outs,
            f"{suit_name}は手札とボードで4枚。残りの{suit_name}は13−4＝{outs}枚が当たりです。",
        )

    if category in {"straight", "oesd", "gutshot"}:
        missing = straight_draw_missing_ranks_using_hole(hole, board)
        outs = (
            len(simple_completion_outs(question))
            if category == "straight"
            else len(new_a_completion_outs(question))
        )
        names = format_rank_values(missing)
        if len(missing) >= 2:
            values = {RANK_VALUE[card[0]] for card in (*hole, *board)}
            if 14 in values:
                values.add(1)
            connected = any(
                all(value + offset in values for offset in range(4))
                for value in range(1, 11)
            )
            if connected:
                shape_copy = f"4枚つながっているので、{names}のどちらでも完成します。"
            else:
                shape_copy = (
                    f"抜けているところが2か所あり、{names}のどちらでも完成します。"
                )
            count_copy = f"{shape_copy}当たりは合わせて{outs}枚。"
        else:
            count_copy = (
                f"そろうのは{names}だけ。1か所だけ抜けた形（ガットショット）で、"
                f"当たりは{names}の{outs}枚です。"
            )
        return outs_approximation(stage, outs, count_copy)

    if category == "flush_or_straight":
        remaining = remaining_cards_for(hole, board)
        flush_outs = {
            card
            for card in remaining
            if has_flush_using_hole(hole, (*board, card))
        }
        straight_outs = {
            card
            for card in remaining
            if has_straight_using_hole(hole, (*board, card))
        }
        if flush_outs and straight_outs:
            overlap = len(flush_outs & straight_outs)
            outs = len(flush_outs | straight_outs)
            if overlap:
                overlap_copy = (
                    f"ただし{overlap}枚は両方に入るので、二重に数えず "
                    f"{len(flush_outs)}＋{len(straight_outs)}−{overlap}＝{outs}枚。"
                )
            else:
                overlap_copy = (
                    f"重なるカードはないので "
                    f"{len(flush_outs)}＋{len(straight_outs)}＝{outs}枚。"
                )
            return outs_approximation(
                stage,
                outs,
                f"フラッシュの当たりが{len(flush_outs)}枚、"
                f"ストレートの当たりが{len(straight_outs)}枚。{overlap_copy}",
            )
        return (
            "次の1枚だけでは、フラッシュもストレートも完成しません。"
            "残り2枚がそろって初めて届く形なので、2枚の組合せを別々に数え、"
            "両方に当てはまる組合せは一度だけ数えます。"
        )

    if category in {"rank_hit", "rank_trips", "four_kind"}:
        target_rank = question["targetRank"]
        rank = display_rank(target_rank)
        visible = sum(card[0] == target_rank for card in known)
        outs = len(simple_completion_outs(question))
        if category == "rank_hit":
            count_copy = (
                f"{rank}は手札の{visible}枚しか見えていないので、"
                f"当たりは残り{outs}枚。"
            )
        elif category == "rank_trips":
            count_copy = (
                f"手札に{rank}が{visible}枚あるので、"
                f"スリーにする当たりの{rank}は残り{outs}枚だけ。"
            )
        else:
            count_copy = (
                f"{rank}は手札とボードに{visible}枚見えています。"
                f"フォーカードにする当たりは残り{outs}枚。"
            )
        return outs_approximation(stage, outs, count_copy)

    if category == "straight_flush":
        outs = len(simple_completion_outs(question))
        return outs_approximation(
            stage,
            outs,
            f"同じマークで連番を完成させるカードだけが当たりなので、{outs}枚だけです。",
        )

    if category == "four_kind":
        raise AssertionError("four_kindは指定カードの説明で処理されます")

    if category == "two_pair":
        if stage == "turn":
            outs = len(simple_completion_outs(question))
            return outs_approximation(
                stage,
                outs,
                f"今のペアとは別の数字とペアになり、ツーペアで終わるカードは{outs}枚。",
            )
        board_counts = Counter(card[0] for card in board)
        single_ranks = [rank for rank, count in board_counts.items() if count == 1]
        direct = sum(4 - count for count in board_counts.values() if count == 1)
        board_copy = "・".join(
            display_rank(rank) for rank in sorted(single_ranks, key=RANKS.index)
        )
        return (
            f"ボードは{board_copy}の{len(single_ranks)}種類。"
            f"このどれかとペアになるカードは{len(single_ranks)}種類×3枚＝{direct}枚です。"
            f"あと2枚めくれるので、1枚あたり約4%で {direct}×4＝約{direct * 4}%。"
            "さらに残り2枚が別々にそろってペアになる道もあり、それを足した値になります。"
        )

    if category == "full_house":
        if stage == "turn":
            outs = len(simple_completion_outs(question))
            return outs_approximation(
                stage,
                outs,
                f"スリー側かペア側を完成させ、フルハウスになるカードは{outs}枚。",
            )
        return (
            "フルハウスはスリー＋ペアの組み合わせなので、あと2枚とも役に立たないと完成しません。"
            "「当たりが何枚か」を数えて済ませられる形ではないということです。"
            "手札のペアをスリーにしてボードもペアになる道と、"
            "ボードの同じ数字を2枚引く道を、1本ずつ数えます。"
        )

    if category == "backdoor_flush":
        target_suit = question["targetSuit"]
        suit_name = SUIT_NAMES[target_suit]
        remaining_same_suit = 13 - sum(card[1] == target_suit for card in known)
        return (
            f"{suit_name}はまだ3枚。4枚目も5枚目も両方{suit_name}でないと届きません。"
            f"残り{remaining_same_suit}枚から2枚続けてなので "
            f"{remaining_same_suit}/47×{remaining_same_suit - 1}/46≒約4%。"
            "「同じマーク3枚なら約4%、4枚なら約35%」と2つセットで覚えます。"
        )

    if category == "board_pair":
        outs = len(new_a_completion_outs(question))
        board_copy = "・".join(
            display_rank(rank)
            for rank in sorted({card[0] for card in board}, key=RANKS.index)
        )
        count_copy = (
            f"ボードの{board_copy}と同じ数字が来ればボードにペアができます。"
            f"当たりは合計{outs}枚。"
        )
        if stage == "flop":
            return (
                f"{count_copy}4枚目で外れても、そこで出た新しい数字が"
                "5枚目のペア候補に加わります。途中で当たりが増えるので、"
                "枚数×確率の概算ではなく、4枚目と5枚目を順に考えます。"
            )
        return outs_approximation(stage, outs, count_copy)

    if category == "overcard":
        outs = len(new_a_completion_outs(question))
        pair_rank = display_rank(hole[0][0])
        total = len(remaining_cards_for(hole, board))
        misses = total - outs
        many = outs * (4 if stage == "flop" else 2) >= 50
        emphasis = "もあります" if many else "です"
        count_copy = (
            f"手札は{pair_rank}のペア。見えていない{total}枚のうち、"
            f"これより高いカードは{outs}枚{emphasis}。"
        )
        if stage == "flop":
            lead = (
                "当たりが多いので、外れの方から考えます。"
                if many
                else "2枚とも外れる場合を先に求めます。"
            )
            return (
                f"{count_copy}{lead}"
                f"外れ{misses}枚が2回続く {misses}/{total}×{misses - 1}/{total - 1} を求め、"
                "100%から引きます。"
            )
        return (
            f"{count_copy}枚数×確率の概算ではなく、"
            f"{outs}/{total} と全体に占める割合で見ます。"
        )

    if category == "board_two_pair":
        if stage == "turn":
            outs = len(new_a_completion_outs(question))
            return outs_approximation(
                stage,
                outs,
                "ボードの別の数字をもう1枚重ねると2組目のペアができます。"
                f"見えていない当たりは{outs}枚。",
            )
        board_copy = "・".join(
            display_rank(rank)
            for rank in sorted({card[0] for card in board}, key=RANKS.index)
        )
        return (
            f"ボードだけで2組のペアを作るには、{board_copy}のうち別々の2つを、"
            "残り2枚で1つずつ重ねる必要があります。"
            "1枚目でどれかが当たり、2枚目で別のもう1つが当たるという2段構えなので、"
            "かなり低い確率になります。"
        )

    if category == "four_flush_board":
        target_suit = question["targetSuit"]
        suit_name = SUIT_NAMES[target_suit]
        on_board = sum(card[1] == target_suit for card in board)
        remaining_same_suit = 13 - sum(card[1] == target_suit for card in known)
        if stage == "turn":
            return outs_approximation(
                stage,
                remaining_same_suit,
                f"ボードの{suit_name}は{on_board}枚。"
                f"見えていない{suit_name}{remaining_same_suit}枚が当たりです。",
            )
        if on_board == 2:
            return (
                f"ボードの{suit_name}は2枚。4枚目も5枚目も両方{suit_name}でないと4枚になりません。"
                f"残り{remaining_same_suit}枚から2枚続けてなので "
                f"{remaining_same_suit}/47×{remaining_same_suit - 1}/46 で求めます。"
                "2枚とも条件を満たす必要があるときは、"
                "当たり枚数を数える方法ではなく、かけ算で求めます。"
            )
        return (
            f"ボードの{suit_name}は3枚なので、あと1枚だけ{suit_name}が来れば4枚。"
            f"2枚とも{suit_name}だと5枚になってしまうので、そこは除きます。"
            "「1枚以上」ではなく「ちょうど1枚」なのがポイントです。"
        )

    if category == "pocket_pair_counterfeit":
        pair_rank = display_rank(hole[0][0])
        if stage == "turn":
            outs = len(new_a_completion_outs(question))
            return outs_approximation(
                stage,
                outs,
                f"ボードだけで{pair_rank}のペアより強い5枚ができると、"
                f"手札のペアは使われなくなります。そうなるカードは{outs}枚。",
            )
        return (
            f"ボードだけで{pair_rank}のペアより強い5枚ができる道を数えます。"
            "ペアができる場合だけでなく、残り2枚の並びや同じマークの重なりも関わるため、"
            "当たりを1種類に絞って数えられる形ではありません。"
            "最後の5枚に自分の手札が残るかで判断します。"
        )

    if category == "two_pair_counterfeit":
        low_rank = display_rank(
            min(hole, key=lambda card: RANK_VALUE[card[0]])[0]
        )
        return (
            f"今のツーペアのうち低い方は{low_rank}。"
            "ボードにこれより強い組合せができると、低い方が最後の5枚から押し出されます。"
            "ボードがペアになる道や、高いカードが2枚並ぶ道があるため、"
            "残り2枚の組合せを数えます。役の名前ではなく、最後に残る5枚で考えます。"
        )

    if category == "same_hand_category":
        remaining = remaining_cards_for(hole, board)
        stays = len(new_a_completion_outs(question))
        changes = len(remaining) - stays
        current = HAND_NAMES[evaluate((*hole, *board))[0]]
        if stage == "turn":
            return (
                f"今は{current}。次の1枚で役が変わるのは{changes}枚、"
                f"変わらないのは{stays}枚です。"
                f"{len(remaining)}枚中{stays}枚なので、"
                f"約{round(100 * stays / len(remaining))}%。"
                "「変わる方を数えて残りを見る」と早くなります。"
            )
        return (
            f"今は{current}。まず残り2枚でペアやストレートなどへ役が変わる組合せを数え、"
            "その合計を100%から引きます。変わる方から数えた方が早く求まります。"
        )

    raise ValueError(f"未対応のモードA解説です: {category}")


REASON_COPY = {
    "pocket_pair": "ポケットペア",
    "broadway": "高い2枚",
    "playable_ace": "Aの高さ",
    "playable_king": "Kの高さ",
    "suited_connector": "同じマークの連番",
    "two_pair_plus": "ツーペア以上",
    "overpair": "オーバーペア",
    "top_pair": "トップペア",
    "flush_draw": "フラッシュドロー",
    "oesd_or_double_gut": "当たり8枚のストレート待ち",
    "gutshot": "当たり4枚のストレート待ち",
    "middle_pair+flush_draw": "ペア＋フラッシュドロー",
    "middle_pair+straight_draw": "ペア＋ストレートドロー",
}


def explain_reasons(reasons: tuple[str, ...]) -> str:
    filtered = list(reasons)
    if "two_pair_plus" in filtered and "top_pair" in filtered:
        filtered.remove("top_pair")
    if "middle_pair+flush_draw" in filtered and "flush_draw" in filtered:
        filtered.remove("flush_draw")
    if "middle_pair+straight_draw" in filtered:
        filtered = [
            reason
            for reason in filtered
            if reason not in {"oesd_or_double_gut", "gutshot"}
        ]
    labels = []
    for reason in filtered:
        label = REASON_COPY[reason]
        if label not in labels:
            labels.append(label)
    return "・".join(labels)


def enumerate_runouts(
    hands: tuple[tuple[str, str], tuple[str, str]],
    board: tuple[str, ...],
    target: int,
) -> dict:
    """残りのカードを実際に配り、対象の手札の勝ち・引き分け・負けを数えます。

    手札の形から付くラベル（OESDなど）ではなく、この実測値から解説を書きます。
    見かけ上のドローが引き分けにしかならない盤面を取りこぼさないためです。
    """
    other = 1 - target
    remaining = remaining_cards_for(hands[0], hands[1], board)
    runouts = (
        [(card,) for card in remaining]
        if len(board) == 4
        else list(itertools.combinations(remaining, 2))
    )
    wins: list[tuple[str, ...]] = []
    ties: list[tuple[str, ...]] = []
    losses = 0
    for runout in runouts:
        final_board = (*board, *runout)
        target_score = evaluate((*hands[target], *final_board))
        other_score = evaluate((*hands[other], *final_board))
        if target_score > other_score:
            wins.append(runout)
        elif target_score == other_score:
            ties.append(runout)
        else:
            losses += 1
    return {
        "total": len(runouts),
        "wins": wins,
        "ties": ties,
        "losses": losses,
        "remaining": len(remaining),
    }


def format_card_ranks(runouts: list[tuple[str, ...]], limit: int = 4) -> str:
    """1枚めくりの結果カードを、重複しない数字の並びにまとめます。

    種類が多すぎると読みにくいため、limit を超える場合は空文字を返し、
    呼び出し側で枚数だけを示す文面に切り替えます。
    """
    ranks = sorted({runout[0][0] for runout in runouts}, key=RANKS.index)
    if len(ranks) > limit:
        return ""
    return "・".join(display_rank(rank) for rank in ranks)


def compare_current_copy(current: list[str], leading: bool = False) -> str:
    """左右の現在の役を、同じ役名が並んでも読みやすい形で説明します。"""
    if current[0] == current[1]:
        comparison_point = {
            "ハイカード": "高いカード",
            "ワンペア": "ペアの数字やキッカー",
            "ツーペア": "2組の数字やキッカー",
            "スリー": "スリーの数字やキッカー",
            "ストレート": "ストレートの高さ",
            "フラッシュ": "フラッシュの高いカード",
            "フルハウス": "スリーとペアの数字",
            "フォーカード": "フォーカードの数字やキッカー",
            "ストレートフラッシュ": "ストレートフラッシュの高さ",
        }[current[1]]
        direction = "上" if leading else "下"
        return f"左右とも{current[1]}ですが、{comparison_point}は右が{direction}です。"
    verb = "勝っています" if leading else "負けています"
    return f"右は{current[1]}で、{current[0]}の左に{verb}。"


def rough_frequency_copy(percent: float) -> str:
    """暗算で選択肢を選ぶための、覚えやすい頻度表現へ丸めます。"""
    references = (
        (5, "20回に1回"),
        (10, "10回に1回"),
        (15, "7回に1回"),
        (20, "5回に1回"),
        (25, "4回に1回"),
        (100 / 3, "3回に1回"),
        (40, "5回に2回"),
        (50, "2回に1回"),
        (60, "5回に3回"),
        (200 / 3, "3回に2回"),
        (75, "4回に3回"),
        (80, "5回に4回"),
        (85, "7回に6回"),
        (90, "10回に9回"),
        (95, "20回に19回"),
    )
    return min(references, key=lambda item: abs(item[0] - percent))[1]


def flop_strength_copy(reasons: tuple[tuple[str, ...], tuple[str, ...]]) -> str:
    """左右の続行材料を、厳密な組合せ数ではなく比較の軸として示します。"""
    left = explain_reasons(reasons[0])
    right = explain_reasons(reasons[1])
    if left == right:
        return f"双方の主な強みは{right}で同程度です。"
    return f"右の主な強みは{right}。左には{left}があります。"


def mode_b_learning_explanation(question: dict) -> str:
    hands = tuple(tuple(hand) for hand in question["hands"])
    board = tuple(question["board"])
    category = question["category"]

    if category == "hand_comparison" and not board:
        archetype = question["archetype"]
        pair_side = next(
            (index for index, hand in enumerate(hands) if hand[0][0] == hand[1][0]),
            None,
        )
        if archetype == "pair_vs_overcards":
            pair_rank = display_rank(hands[pair_side][0][0]) if pair_side is not None else ""
            high_card_side = 1 - pair_side if pair_side is not None else 0
            high_cards = "・".join(
                display_rank(card[0])
                for card in sorted(
                    hands[high_card_side],
                    key=lambda card: RANK_VALUE[card[0]],
                    reverse=True,
                )
            )
            high_card_draws = "か".join(high_cards.split("・"))
            pair_equity = question["equities"][pair_side] if pair_side is not None else 50
            if abs(pair_equity - 50) <= 0.5:
                matchup_copy = (
                    "手札同士の相性によって勝率は変わり、"
                    "この組合せはほぼ互角です。"
                )
            else:
                favored_side = (
                    f"{pair_rank}のペア" if pair_equity > 50 else f"{high_cards}側"
                )
                degree = "わずかに" if abs(pair_equity - 50) <= 3 else "やや"
                matchup_copy = (
                    "手札同士の相性によって勝率は変わり、"
                    f"この組合せでは"
                    f"{favored_side}が{degree}有利です。"
                )
            return (
                f"{pair_rank}のペアは最初からワンペアで先行し、"
                f"{high_cards}側は主に{high_card_draws}を引いて逆転します。"
                f"{matchup_copy}"
            )
        if archetype == "pair_vs_high_cards":
            return (
                "ペア側は最初から役ができていて先行します。"
                "高いカード側は、ペアになる道に加えてストレートやフラッシュの伸びも足して比べます。"
                "まず完成しているペア、次に相手の2枚の高さの順で見ます。"
            )
        if archetype == "pair_vs_pair":
            pair_ranks = [display_rank(hand[0][0]) for hand in hands]
            return (
                f"{pair_ranks[0]}のペア対{pair_ranks[1]}のペアでは、高い方が約80%と大きく先行します。"
                "低い側の勝ち筋はほぼ、同じ数字をもう1枚引いてスリーにする道だけです。"
                "「ペア同士は高い方が約8割」と覚えます。"
            )
        if archetype == "domination":
            shared = next(iter({card[0] for card in hands[0]} & {card[0] for card in hands[1]}))
            return (
                f"どちらも{display_rank(shared)}を持っているので、"
                f"{display_rank(shared)}が場に出ても2枚目（キッカー）で勝負が決まります。"
                "低いキッカー側は別の数字を当てるしかなく、約25%まで下がります。"
                "同じカードを共有したらキッカー勝負です。"
            )
        return (
            "まずペアの有無と2枚の高さを比べ、次に同じマークや数字の近さによる伸びを足します。"
            "ペア→高さ→同じマーク・連続性の順に見ると比べやすくなります。"
        )

    current = [HAND_NAMES[evaluate((*hand, *board))[0]] for hand in hands]
    reasons = tuple(continuation_reasons(hand, board) for hand in hands)
    street_multiplier = 4 if question["stage"] == "flop" else 2

    if category == "hand_comparison":
        archetype = question["archetype"]
        if archetype == "top_pair_vs_flush_draw":
            draw_index = next(
                index
                for index, hand_reasons in enumerate(reasons)
                if "flush_draw" in hand_reasons
            )
            made_index = 1 - draw_index
            sides = ("左", "右")
            draw_hand = hands[draw_index]
            draw_suit = next(
                suit
                for suit in SUITS
                if any(card[1] == suit for card in draw_hand)
                and sum(card[1] == suit for card in (*draw_hand, *board)) == 4
            )
            draw_outs = 13 - sum(
                card[1] == draw_suit for card in (*hands[0], *hands[1], *board)
            )
            return (
                f"{sides[made_index]}の{current[made_index]}は今の時点でできている役。"
                f"{sides[draw_index]}はまだ役なしですが、"
                f"当たりの{SUIT_NAMES[draw_suit]}が{draw_outs}枚あります。"
                f"1枚あたり約{street_multiplier}%で "
                f"{draw_outs}×{street_multiplier}＝約{draw_outs * street_multiplier}%が"
                f"{sides[draw_index]}の逆転率の目安、残りが{sides[made_index]}の勝率です。"
            )
        if archetype == "one_pair_kicker":
            return (
                "どちらも同じトップペアなので、次にペア以外の最も高いカード（キッカー）を比べます。"
                "キッカーが上の側が有利で、その後に残りの伸びを足して考えます。"
            )
        if archetype == "draw_vs_two_pair_plus":
            return (
                f"現在は左が{current[0]}、右が{current[1]}で、ツーペア以上の側が先行します。"
                "待っている側は当たり枚数を数えますが、ボードがペアになると"
                "相手がフルハウスへ伸びることもあります。"
                "自分の当たりだけでなく、相手の再逆転も見ます。"
            )
        if archetype == "combo_hand":
            return (
                f"現在は左が{current[0]}、右が{current[1]}。"
                "ペアと待ちを両方持つ側は、今の強さと当たり枚数の両方を数えます。"
                "ストレートとフラッシュで重なるカードは一度だけ数えます。"
            )
        return (
            f"現在は左が{current[0]}、右が{current[1]}。役が違えば強い方を先に、"
            "同じならキッカーを比べ、その後に残りの当たり枚数を足します。"
        )

    if category not in {"trailing_hand_wins", "leading_hand_holds"}:
        raise ValueError(f"未対応のモードB解説です: {category}")

    result = enumerate_runouts(hands, board, 1)
    win_count = len(result["wins"])
    tie_count = len(result["ties"])
    total = result["total"]
    percent = round(100 * win_count / total, 1)

    if question["stage"] == "turn":
        right_reasons = explain_reasons(reasons[1])
        win_copy = format_card_ranks(result["wins"])
        tie_copy = format_card_ranks(result["ties"]) if tie_count else ""
        if category == "trailing_hand_wins":
            lead_copy = compare_current_copy(current)
            if tie_count and tie_count >= win_count:
                tie_lead = (
                    f"{tie_copy}が来ると左も同じ役になり、引き分けです"
                    if tie_copy
                    else "左も同じ役になって引き分けになるカードが多く"
                )
                win_lead = (
                    f"{win_copy}の{win_count}枚だけ" if win_copy else f"{win_count}枚だけ"
                )
                return (
                    f"{lead_copy}{tie_lead}（{total}枚中{tie_count}枚）。"
                    f"右が単独で勝てるのは{win_lead}。"
                    f"あと1枚しかめくれないので {win_count}÷{total}＝約{percent}%です。"
                    "見かけの勝ち筋が引き分けにしかならない形に注意します。"
                )
            tie_note = (
                f"なお{tie_count}枚は引き分けで、勝ちには数えません。"
                if tie_count
                else ""
            )
            win_lead = (
                f"{win_copy}の{win_count}枚" if win_copy else f"{win_count}枚"
            )
            return (
                f"{lead_copy}逆転できるのは{win_lead}。"
                f"あと1枚しかめくれないので {win_count}÷{total}＝約{percent}%です。{tie_note}"
            )
        lose_copy = result["losses"]
        tie_note = (
            f"引き分けの{tie_count}枚も勝ちには数えません。" if tie_count else ""
        )
        return (
            f"{compare_current_copy(current, leading=True)}"
            f"逆転されるのは{lose_copy}枚で、右がそのまま勝つのは{win_count}枚。"
            f"{total}枚中{win_count}枚なので約{percent}%です。{tie_note}"
        )

    frequency = rough_frequency_copy(percent)
    strength_copy = flop_strength_copy(reasons)
    tie_note = "引き分けは勝ちに含めません。" if tie_count else ""
    if category == "trailing_hand_wins":
        return (
            f"{compare_current_copy(current)}{strength_copy}"
            "あと2枚あるので、右の当たりを軸に、左の再逆転と引き分けもざっくり差し引きます。"
            f"右が逆転して単独で勝つのは、およそ{frequency}と見積もります。"
            f"実際は約{percent}%です。{tie_note}"
        )
    return (
        f"{compare_current_copy(current, leading=True)}{strength_copy}"
        "あと2枚あるので、今のリードを軸に、左の逆転と引き分けもざっくり差し引きます。"
        f"右が単独で勝ち切るのは、およそ{frequency}と見積もります。"
        f"実際は約{percent}%です。{tie_note}"
    )


def preflop_hand_learning_copy(hole: tuple[str, str]) -> str:
    first, second = hole
    first_value = RANK_VALUE[first[0]]
    second_value = RANK_VALUE[second[0]]
    if first_value == second_value:
        return f"手札は{display_rank(first[0])}のポケットペアで、最初からワンペアです。"
    high, low = sorted((first_value, second_value), reverse=True)
    reverse = {value: rank for rank, value in RANK_VALUE.items()}
    cards = f"{display_rank(reverse[high])}・{display_rank(reverse[low])}"
    features = []
    if first[1] == second[1]:
        features.append("同じマークでフラッシュの道")
    if high - low == 1:
        features.append("連番でストレートの道")
    elif high - low <= 3:
        features.append("数字が近くストレートの道")
    if features:
        return f"手札は{cards}で、{features[0]}があります。"
    return f"手札は{cards}で、{display_rank(reverse[high])}の高さが主な強みです。"


def hole_improves_hand(hole: tuple[str, str], board: tuple[str, ...]) -> bool:
    """手札2枚が、今の役の種類を作るのに使われているかを判定します。

    ボードだけで同じ種類の役ができるなら False を返します。
    キッカーとしてしか働いていない場合も False です。
    """
    board_counts = Counter(card[0] for card in board)
    board_category = 0
    if any(count >= 4 for count in board_counts.values()):
        board_category = 7
    elif sorted(board_counts.values(), reverse=True)[:2] == [3, 2]:
        board_category = 6
    elif has_flush(board):
        board_category = 5
    elif has_straight(board):
        board_category = 4
    elif any(count >= 3 for count in board_counts.values()):
        board_category = 3
    elif sum(count >= 2 for count in board_counts.values()) >= 2:
        board_category = 2
    elif any(count >= 2 for count in board_counts.values()):
        board_category = 1
    return evaluate((*hole, *board))[0] > board_category


def mode_c_learning_explanation(question: dict) -> str:
    hole = tuple(question["hole"])
    board = tuple(question["board"])
    players = question["playerCount"]
    if question["category"] == "preflop_equity":
        hand_copy = preflop_hand_learning_copy(hole)
        if players == 2:
            return (
                f"{hand_copy}2人なら相手は1人だけ。まずペアの有無、次に2枚の高さ、"
                "最後に同じマークや数字の近さを見ます。"
            )
        even = round(100 / players, 1)
        return (
            f"{hand_copy}{players}人では相手{players - 1}人全員に勝つ必要があります。"
            f"全員が互角なら1人あたり約{even}%で、そこを上回るか下回るかが目安です。"
            "細かい値はスターティングハンド勝率表で確認しましょう。"
        )

    current = HAND_NAMES[evaluate((*hole, *board))[0]]
    reasons = continuation_reasons(hole, board)
    draw_copy = explain_reasons(reasons) if reasons else "目立った完成役や強いドローなし"
    board_only = not hole_improves_hand(hole, board)
    if board_only:
        contribution_copy = (
            f"今の{current}はボードだけでできていて、自分の手札は何も足していません。"
        )
    else:
        contribution_copy = f"現在は{current}で、確認する強みは{draw_copy}。"
    if players == 2:
        return (
            f"{contribution_copy}まず今の役の強さ、次に当たり枚数、"
            "最後にキッカーの順で見ます。"
            "勝率には、役が完成する確率だけでなく、今のまま勝ち切る道も含まれます。"
        )
    return (
        f"{contribution_copy}{players}人では相手{players - 1}人の誰かに"
        "上回られる可能性が増えるため、同じ役でも高いキッカーや強いドローほど価値が上がります。"
        "1対1の値をそのまま人数で割るのではなく、多人数用の目安として覚えます。"
    )


def opponent_counting_suffix(players: int) -> str:
    if players == 2:
        return "2人卓は、見えていないカードから相手の2枚の組合せを数えます。"
    return (
        f"{players}人卓は相手{players - 1}人へ重複なく配るので、1人分を{players - 1}倍せず、"
        "「誰も持っていない確率」を先に求めて1から引きます。"
    )


def straight_routes_from_board(board: tuple[str, ...]) -> tuple[tuple[str, ...], ...]:
    board_ranks = {card[0] for card in board}
    routes = {
        tuple(rank for rank in sequence if rank not in board_ranks)
        for sequence in STRAIGHT_SEQUENCES
        if board_ranks <= set(sequence)
        and 1 <= len(set(sequence) - board_ranks) <= 2
    }
    return tuple(sorted(routes, key=lambda route: tuple(RANK_VALUE[rank] for rank in route)))


def format_straight_routes(routes: tuple[tuple[str, ...], ...]) -> str:
    return "、".join("・".join(display_rank(rank) for rank in route) for route in routes)


def mode_d_learning_explanation(question: dict) -> str:
    category = question["category"]
    players = question["playerCount"]
    hole = tuple(question["hole"])
    board = tuple(question["board"])
    known = (*hole, *board)
    suffix = opponent_counting_suffix(players)

    if category in {
        "opponent_rank",
        "exactly_one_opponent_target_rank",
        "multiple_opponents_target_rank",
    }:
        target_rank = question["targetRank"]
        rank = display_rank(target_rank)
        visible = sum(card[0] == target_rank for card in known)
        remaining = 4 - visible
        if visible:
            visible_copy = f"{rank}は自分とボードに{visible}枚見えているので、残りは{remaining}枚。"
        else:
            visible_copy = f"{rank}は自分にもボードにも無いので、{remaining}枚すべてが残っています。"
        if category == "opponent_rank" and players == 2:
            return (
                f"{visible_copy}相手は2枚もらうので、そのどれかが入る確率を数えます。"
                "「残り枚数×約4%」が2人卓の暗算目安です。"
            )
        if category == "exactly_one_opponent_target_rank":
            target_copy = (
                "そのカードがちょうど1人だけに配られる組合せを数え、"
                "0人の場合と2人以上の場合を除きます。"
            )
        elif category == "multiple_opponents_target_rank":
            target_copy = (
                f"残りのカードが別々の相手へ配られ、2人以上が持つ組合せを数えます。"
                f"1人に{remaining}枚まとまって入った場合は「2人以上」に数えません。"
            )
        else:
            target_copy = f"相手{players - 1}人の{(players - 1) * 2}枚へ1枚以上入るかを考えます。"
        return f"{visible_copy}{target_copy}{suffix}"

    if category == "opponent_pocket_pair":
        if players == 2:
            return (
                "相手が同じ数字を2枚そろえる組合せは、全1326通り中78通り＝約6%。"
                "同じ数字4枚から2枚選ぶ組合せが6通りで、それが13種類あるためです。"
                "「1人なら約6%」と覚えます。"
            )
        return (
            "相手1人がポケットペアになる確率は約6%が基準です。"
            f"{players}人卓では「相手{players - 1}人とも持っていない」確率を先に求めて1から引き、"
            "約25%まで上がります。「1人なら約6%、5人相手なら約25%」と覚えます。"
        )

    if category == "opponent_overpair":
        top_value = max(RANK_VALUE[card[0]] for card in board)
        candidates = [
            rank
            for rank in RANKS
            if RANK_VALUE[rank] > top_value
            and 4 - sum(card[0] == rank for card in known) >= 2
        ]
        top_rank_copy = display_rank(
            max(board, key=lambda card: RANK_VALUE[card[0]])[0]
        )
        candidate_copy = "・".join(display_rank(rank) for rank in candidates) or "なし"
        pair_ways = sum(
            math.comb(4 - sum(card[0] == rank for card in known), 2)
            for rank in candidates
        )
        return (
            f"ボードの最高は{top_rank_copy}。それより上のポケットペアは"
            f"{candidate_copy}の{len(candidates)}種類だけです。"
            f"それぞれ残り枚数から2枚選ぶので、合わせて{pair_ways}通り。{suffix}"
        )

    if category == "opponent_set":
        board_counts = Counter(card[0] for card in board)
        candidates = [
            rank
            for rank, count in board_counts.items()
            if count == 1 and 4 - sum(card[0] == rank for card in known) >= 2
        ]
        candidate_copy = "・".join(
            display_rank(rank) for rank in sorted(candidates, key=RANKS.index)
        ) or "該当なし"
        set_ways = sum(
            math.comb(4 - sum(card[0] == rank for card in known), 2)
            for rank in candidates
        )
        return (
            f"ボードに1枚ずつある{candidate_copy}を、相手が2枚とも手札で持っている場合だけを数えます。"
            f"合わせて{set_ways}通り。手札1枚を合わせる普通のスリーとは分けます。"
            f"この形をセットと呼びます。{suffix}"
        )

    if category == "opponent_top_pair_plus":
        top_rank = max(board, key=lambda card: RANK_VALUE[card[0]])[0]
        rank = display_rank(top_rank)
        remaining = 4 - sum(card[0] == top_rank for card in known)
        if players == 2:
            return (
                f"ボードで一番高い{rank}は、見えていないものが{remaining}枚。"
                f"この{remaining}枚のどれかを相手が持てばトップペア以上です。"
                f"{suffix}"
            )
        return (
            f"ボードで一番高い{rank}は、見えていないものが{remaining}枚。"
            f"この{remaining}枚が相手{players - 1}人の{(players - 1) * 2}枚のどこにも"
            "入らない確率を求め、1から引きます。"
        )

    if category == "opponent_two_pair":
        board_counts = Counter(card[0] for card in board)
        board_copy = "・".join(
            display_rank(rank)
            for rank in sorted(board_counts, key=RANKS.index)
        )
        if any(count >= 2 for count in board_counts.values()):
            paired_copy = display_rank(
                next(rank for rank, count in board_counts.items() if count >= 2)
            )
            return (
                f"ボードはすでに{paired_copy}のペアを含んでいます。"
                "相手は手札1枚をボードの別の数字に合わせるだけでツーペアです。"
                f"{suffix}"
            )
        return (
            f"相手の2枚が、ボードの{board_copy}のうち別々の2つとペアになる組合せを数えます。"
            "同じ数字を2枚持つポケットペアや、スリー以上になる組合せとは分けます。"
            f"{suffix}"
        )

    if category == "opponent_straight":
        routes = straight_routes_from_board(board)
        if routes:
            route_copy = format_straight_routes(routes)
            return (
                f"相手が5連続を作るには{route_copy}が必要です。"
                "相手の手札を最低1枚使って5連続になる2枚組だけを数えます。"
                f"{suffix}"
            )
        board_copy = "・".join(
            display_rank(rank)
            for rank in sorted({card[0] for card in board}, key=RANKS.index)
        )
        return (
            f"ボードは{board_copy}。相手が5連続を作るには、手札2枚とも"
            "特定のカードでなければならず、組合せは限られます。"
            f"{suffix}"
        )

    if category == "opponent_flush":
        suit, count = Counter(card[1] for card in board).most_common(1)[0]
        needed = 5 - count
        remaining = 13 - sum(card[1] == suit for card in known)
        ways = math.comb(remaining, needed) if needed <= remaining else 0
        return (
            f"ボードの{SUIT_NAMES[suit]}は{count}枚。"
            f"相手は手札に{SUIT_NAMES[suit]}が{needed}枚ないとフラッシュになりません。"
            f"見えていない{SUIT_NAMES[suit]}は{remaining}枚で、そこから{needed}枚選ぶ{ways}通り。"
            f"{suffix}"
        )

    if category in {
        "opponent_straight_three_connected_board",
        "opponent_straight_four_connected_board",
    }:
        routes = straight_routes_from_board(board)
        route_copy = format_straight_routes(routes)
        board_copy = "・".join(
            display_rank(rank)
            for rank in sorted({card[0] for card in board}, key=RANKS.index)
        )
        if category == "opponent_straight_three_connected_board":
            return (
                f"ボードが{board_copy}と3枚つながっています。"
                f"完成する手札は{route_copy}の{len(routes)}系統。"
                "ただし同じ相手が2枚とも持つ必要があり、2人に分かれては完成しません。"
                "フォールドは考慮しません。"
            )
        missing = sorted({rank for route in routes for rank in route}, key=RANKS.index)
        missing_copy = "・".join(display_rank(rank) for rank in missing)
        missing_left = sum(
            4 - sum(card[0] == rank for card in known) for rank in missing
        )
        return (
            f"ボードが{board_copy}と4枚つながっているので、相手は{missing_copy}を"
            f"1枚持っているだけでストレートです。該当するカードは{missing_left}枚。"
            f"相手{players - 1}人の{(players - 1) * 2}枚に1枚も入らない方が珍しくなります。"
            "フォールドは考慮しません。"
        )

    if category in {
        "opponent_flush_three_suited_board",
        "opponent_flush_four_suited_board",
    }:
        target_suit = board[0][1]
        suit_name = SUIT_NAMES[target_suit]
        remaining = 13 - sum(card[1] == target_suit for card in known)
        if category == "opponent_flush_three_suited_board":
            return (
                f"ボードの{suit_name}が3枚で、見えていない{suit_name}は{remaining}枚。"
                f"同じ相手が手札2枚とも{suit_name}を持つ必要があり、"
                "2人に1枚ずつ分かれてもフラッシュにはなりません。フォールドは考慮しません。"
            )
        return (
            f"ボードの{suit_name}が4枚。相手は1枚持っているだけでフラッシュです。"
            f"見えていない{suit_name}{remaining}枚が、"
            f"相手{players - 1}人の{(players - 1) * 2}枚のどこにも入らない確率を求め、1から引きます。"
            "フォールドは考慮しません。"
        )

    if category == "opponent_flush_draw":
        suit, count = Counter(card[1] for card in board).most_common(1)[0]
        needed = max(1, 4 - count)
        remaining = 13 - sum(card[1] == suit for card in known)
        return (
            f"ボードの{SUIT_NAMES[suit]}は{count}枚。"
            f"相手が{SUIT_NAMES[suit]}を{needed}枚持っていれば合わせて4枚になり、"
            "あと1枚でフラッシュという状態です。"
            f"見えていない{SUIT_NAMES[suit]}は{remaining}枚。{suffix}"
        )

    if category == "opponent_combo_draw":
        return (
            "ストレート待ちとフラッシュ待ちを、同じ2枚で同時に満たす組合せだけを数えます。"
            "それぞれの確率を足すのではなく、両方に当てはまる手札を探すのがポイントです。"
            f"条件が厳しいぶん、低い確率になります。{suffix}"
        )

    if category == "opponent_higher_flush":
        hero_score = evaluate((*hole, *board))
        suit = Counter(card[1] for card in board).most_common(1)[0][0]
        remaining = 13 - sum(card[1] == suit for card in known)
        top_copy = display_rank(
            next(rank for rank, value in RANK_VALUE.items() if value == hero_score[1])
        )
        return (
            f"自分は{SUIT_NAMES[suit]}のフラッシュですが、一番高いカードは{top_copy}。"
            f"見えていない{SUIT_NAMES[suit]}は{remaining}枚で、"
            f"その中で{top_copy}より高いカードを持つ相手がいれば負けます。"
            f"フラッシュ同士は上から順に比べます。{suffix}"
        )

    if category == "opponent_same_pair_higher_kicker":
        hero_score = evaluate((*hole, *board))
        pair_rank = display_rank(next(rank for rank, value in RANK_VALUE.items() if value == hero_score[1]))
        hero_kicker = display_rank(next(rank for rank, value in RANK_VALUE.items() if value == hero_score[2]))
        return (
            f"自分は{pair_rank}のペアで、2枚目に効くキッカーは{hero_kicker}。"
            f"相手も{pair_rank}のペアを作り、キッカーが{hero_kicker}より上なら負けます。"
            f"同じペアのときは、ペア以外のカードを上から比べます。{suffix}"
        )

    if category == "all_opponents_miss_board":
        board_copy = "・".join(display_rank(rank) for rank in sorted({card[0] for card in board}, key=RANKS.index))
        board_ranks = {card[0] for card in board}
        remaining = sum(
            4 - sum(card[0] == rank for card in known) for rank in board_ranks
        )
        if players == 2:
            return (
                f"ボードの{board_copy}と同じ数字は残り{remaining}枚。"
                f"相手の2枚が、その{remaining}枚をどちらも引かない組合せを数えます。"
                "当たる確率ではなく、外れる確率を求めます。"
            )
        return (
            f"ボードの{board_copy}と同じ数字は残り{remaining}枚。"
            f"この{remaining}枚が、相手{players - 1}人の{(players - 1) * 2}枚に"
            "1枚も入らない確率です。"
            f"相手ごとに独立ではないので、1人分を{players - 1}乗せず、"
            f"{(players - 1) * 2}枚をまとめて考えます。"
        )

    raise ValueError(f"未対応のモードD解説です: {category}")


def learning_explanation(question: dict) -> str:
    if question["mode"] == "A":
        return mode_a_learning_explanation(question)
    if question["mode"] == "B":
        return mode_b_learning_explanation(question)
    if question["mode"] == "C":
        return mode_c_learning_explanation(question)
    if question["mode"] == "D":
        return mode_d_learning_explanation(question)
    raise ValueError(f"未対応のモードです: {question['mode']}")


def normalize_question_copy(question: dict) -> None:
    if question["mode"] == "A" and question["category"] in A_COUNTS:
        question["prompt"], question["explain"] = prompt_and_explanation(
            question["category"],
            question.get("targetRank"),
            question["stage"],
            question["trueP"],
        )
    elif question["mode"] == "A" and question["category"] in NEW_A_COUNTS:
        question["prompt"], question["explain"] = new_a_copy(
            question["category"],
            question["stage"],
            tuple(question["hole"]),
            question.get("targetSuit"),
        )
    if question["mode"] == "B" and question["category"] in NEW_B_COUNTS:
        hands = tuple(tuple(hand) for hand in question["hands"])
        board = tuple(question["board"])
        current = [evaluate((*hand, *board)) for hand in hands]
        leader = 0 if current[0] > current[1] else 1 if current[1] > current[0] else None
        question["prompt"], question["explain"], target_hand = mode_b_copy(
            question["category"],
            leader,
        )
        if target_hand is None:
            question.pop("targetHand", None)
        else:
            question["targetHand"] = target_hand
    if question["mode"] == "B" and question["category"] == "hand_comparison":
        question["prompt"] = "勝率が高いのは？"
    if question["mode"] == "D":
        question["prompt"], question["explain"] = mode_d_copy(
            question["category"],
            question["playerCount"],
            question.get("targetRank"),
            tuple(question["board"]),
        )
    question["explain"] = learning_explanation(question)
    question["prompt"] = question["prompt"].replace("スート", "マーク")
    question["explain"] = question["explain"].replace("スート", "マーク")


def normalize_question_choices(question: dict) -> None:
    if question.get("answerType") != "percent":
        return
    correct = nearest_bucket(question["trueP"])
    wrong = nearest_bucket(float(question["distractor"].removesuffix("%")))
    question["answer"] = percent_label(correct)
    question["distractor"] = percent_label(spaced_distractor(correct, wrong))


def render_json(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"


def spread_questions(questions: list[dict], file_count: int) -> list[list[dict]]:
    buckets = [[] for _ in range(file_count)]
    offset = 0
    for category in sorted({question["category"] for question in questions}):
        category_questions = [question for question in questions if question["category"] == category]
        category_questions.sort(key=lambda question: hashlib.sha256(question["id"].encode()).digest())
        for index, question in enumerate(category_questions):
            buckets[(offset + index) % file_count].append(question)
        offset = (offset + len(category_questions)) % file_count
    return buckets


def expected_files(bank_by_mode: dict[str, list[dict]]) -> dict[Path, str]:
    files = {}
    manifest = {
        "version": "", "total": sum(MODE_COUNTS.values()), "batchSize": BATCH_SIZE,
        "modes": {mode: {"count": len(questions)} for mode, questions in bank_by_mode.items()},
        "groups": {
            "A": {"count": GROUP_COUNTS["A"], "files": GROUP_COUNTS["A"] // BATCH_SIZE, "path": "a"},
            "BC": {"count": GROUP_COUNTS["BC"], "files": GROUP_COUNTS["BC"] // BATCH_SIZE, "path": "bc"},
            "D": {"count": GROUP_COUNTS["D"], "files": GROUP_COUNTS["D"] // BATCH_SIZE, "path": "d"},
        },
    }
    digest = hashlib.sha256()
    classic_b = [question for question in bank_by_mode["B"] if question["answerType"] == "hand"]
    numeric_b = [question for question in bank_by_mode["B"] if question["answerType"] == "percent"]
    group_chunks = {
        "a": spread_questions(bank_by_mode["A"], GROUP_COUNTS["A"] // BATCH_SIZE),
        "bc": [
            [*classic, *numeric, *mode_c]
            for classic, numeric, mode_c in zip(
                spread_questions(classic_b, GROUP_COUNTS["BC"] // BATCH_SIZE),
                spread_questions(numeric_b, GROUP_COUNTS["BC"] // BATCH_SIZE),
                spread_questions(bank_by_mode["C"], GROUP_COUNTS["BC"] // BATCH_SIZE),
                strict=True,
            )
        ],
        "d": spread_questions(bank_by_mode["D"], GROUP_COUNTS["D"] // BATCH_SIZE),
    }
    for group, chunks in group_chunks.items():
        for index, chunk in enumerate(chunks, 1):
            if len(chunk) != BATCH_SIZE:
                raise RuntimeError(f"{group}/{index:04d}.json が{BATCH_SIZE}問ではありません")
            path = Path(group) / f"{index:04d}.json"
            content = render_json(chunk)
            files[path] = content
            digest.update(path.as_posix().encode())
            digest.update(content.encode())
    manifest["version"] = digest.hexdigest()[:12]
    files[Path("manifest.json")] = render_json(manifest)
    return files


def check_output() -> int:
    manifest_path = OUTPUT / "manifest.json"
    if not manifest_path.exists():
        print("public/questions は再生成が必要です", file=sys.stderr)
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    questions = []
    for group, expected_count in (
        ("a", GROUP_COUNTS["A"]),
        ("bc", GROUP_COUNTS["BC"]),
        ("d", GROUP_COUNTS["D"]),
    ):
        paths = sorted((OUTPUT / group).glob("*.json"))
        if len(paths) != expected_count // BATCH_SIZE:
            raise RuntimeError(f"グループ{group}のJSON数が不正です")
        for path in paths:
            chunk = json.loads(path.read_text(encoding="utf-8"))
            if len(chunk) != BATCH_SIZE:
                raise RuntimeError(f"{path.relative_to(ROOT)} の問題数が不正です")
            questions.extend(chunk)
    bank = questions
    validate(bank)
    mode_counts = Counter(question["mode"] for question in bank)
    if manifest.get("total") != len(bank) or manifest.get("modes") != {
        mode: {"count": count} for mode, count in MODE_COUNTS.items()
    } or dict(mode_counts) != MODE_COUNTS:
        raise RuntimeError("manifest.json が問題データと一致しません")
    print(
        f"問題バンク: {len(bank):,}問 / "
        f"JSON {sum(GROUP_COUNTS.values()) // BATCH_SIZE}ファイル / 全件検証済み"
    )
    return 0


def load_existing_legacy() -> dict[str, list[dict]] | None:
    """Keep the reviewed first 10,000 records instead of recalculating them."""
    if not OUTPUT.exists():
        return None
    questions = []
    for directory in ("a", "b", "c", "d", "bc"):
        path = OUTPUT / directory
        if not path.exists():
            continue
        for source in sorted(path.glob("*.json")):
            questions.extend(json.loads(source.read_text(encoding="utf-8")))
    limits = LEGACY_MODE_COUNTS
    legacy = {mode: [] for mode in limits}
    for question in questions:
        mode = question.get("mode")
        if mode not in limits:
            continue
        number = int(question["id"].split("-")[1])
        if number <= limits[mode]:
            question.setdefault("answerType", "hand" if mode == "B" else "percent")
            legacy[mode].append(question)
    if {mode: len(items) for mode, items in legacy.items()} != limits:
        return None
    for items in legacy.values():
        items.sort(key=lambda question: int(question["id"].split("-")[1]))
    return legacy


def load_existing_additions() -> dict[str, list[dict]]:
    additions = {mode: [] for mode in MODE_COUNTS}
    if not OUTPUT.exists():
        return additions
    for directory in ("a", "bc", "d"):
        path = OUTPUT / directory
        if not path.exists():
            continue
        for source in sorted(path.glob("*.json")):
            for question in json.loads(source.read_text(encoding="utf-8")):
                mode = question.get("mode")
                if mode not in additions:
                    continue
                number = int(question["id"].split("-")[1])
                if number > LEGACY_MODE_COUNTS[mode]:
                    additions[mode].append(question)
    for items in additions.values():
        items.sort(key=lambda question: int(question["id"].split("-")[1]))
    return additions


def extend_mode_d_additions(
    existing: list[dict], rng: random.Random
) -> list[dict] | None:
    """Reuse reviewed D additions when the source only appends new categories."""
    actual = Counter(question["category"] for question in existing)
    if any(actual[category] > expected for category, expected in NEW_D_COUNTS.items()):
        return None
    if any(category not in NEW_D_COUNTS for category in actual):
        return None
    missing = {
        category: expected - actual[category]
        for category, expected in NEW_D_COUNTS.items()
        if expected > actual[category]
    }
    if not missing:
        return existing
    print(
        "モードDは既存追加分を再利用し、新規カテゴリだけ生成します",
        flush=True,
    )
    generated = build_new_mode_d(rng, missing, len(existing))
    return [*existing, *generated]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        return check_output()
    legacy_by_mode = load_existing_legacy()
    if legacy_by_mode is None:
        rng = random.Random(20260802)
        legacy_by_mode = {}
        for mode, builder in (("A", build_mode_a), ("B", build_mode_b), ("C", build_mode_c), ("D", build_mode_d)):
            legacy_by_mode[mode] = builder(rng)
    else:
        if any(
            question["trueP"] == 0
            or "ランナーランナー" in question.get("explain", "")
            or "バックドア" in question.get("explain", "")
            for question in legacy_by_mode["A"]
        ):
            print("モードA従来分を品質基準に合わせて再生成します", flush=True)
            legacy_by_mode["A"] = build_mode_a(random.Random(20260802))
        if any(
            not question.get("continuationReasons")
            or not question.get("archetype")
            for question in legacy_by_mode["B"]
        ) or Counter(
            (question["stage"], question.get("archetype"))
            for question in legacy_by_mode["B"]
        ) != Counter(
            {
                (stage, archetype): count
                for stage, targets in B_HAND_COMPARISON_STAGE_TARGETS.items()
                for archetype, count in targets.items()
            }
        ) or any(
            question["stage"] == "preflop"
            and (
                max(question["equities"]) < 51
                or is_obvious_preflop_comparison(
                    tuple(tuple(hand) for hand in question["hands"])
                )
            )
            for question in legacy_by_mode["B"]
        ):
            print("モードB従来分を実戦的な対決へ再生成します", flush=True)
            legacy_by_mode["B"] = build_mode_b(
                random.Random(20260803),
                legacy_by_mode["B"],
            )
        if any(
            question["stage"] == "preflop"
            and question.get("simulationTrials") != 12_000
            for question in legacy_by_mode["B"]
        ):
            print("モードBプリフロップ勝率を12,000試行で再計算します", flush=True)
            legacy_by_mode["B"] = refresh_preflop_comparison_equities(
                legacy_by_mode["B"]
            )
        if {
            question["playerCount"]
            for question in legacy_by_mode["C"]
            if question["category"] == "preflop_equity"
        } != {6, 9}:
            print("モードCプリフロップを6人・9人卓へ再生成します", flush=True)
            legacy_by_mode["C"] = build_mode_c(random.Random(20260804))
    existing_additions = load_existing_additions()
    additions = {}
    for mode, builder, seed in (
        ("A", build_new_mode_a, 2026081201),
        ("B", build_new_mode_b, 2026081202),
        ("C", build_new_mode_c, 2026081203),
        ("D", build_new_mode_d, 2026081204),
    ):
        cache_version = {"A": "-v6", "B": "-v9", "D": "-v3"}.get(mode, "")
        cache_path = Path("/tmp") / f"anzan-poker-new-{mode.lower()}{cache_version}.json"
        expected = MODE_COUNTS[mode] - LEGACY_MODE_COUNTS[mode]
        extended_d = (
            extend_mode_d_additions(existing_additions[mode], random.Random(seed))
            if mode == "D" and existing_additions[mode]
            else None
        )
        if mode == "D" and extended_d is not None and len(extended_d) == expected:
            additions[mode] = extended_d
        elif mode in {"C", "D"} and len(existing_additions[mode]) == expected:
            additions[mode] = existing_additions[mode]
        elif cache_path.exists():
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            additions[mode] = cached if len(cached) == expected else builder(random.Random(seed))
        else:
            additions[mode] = builder(random.Random(seed))
        cache_path.write_text(render_json(additions[mode]), encoding="utf-8")
        print(f"モード{mode}追加分: {len(additions[mode]):,}問", flush=True)
    bank_by_mode = {
        mode: [*legacy_by_mode[mode], *additions[mode]]
        for mode in MODE_COUNTS
    }
    for questions in bank_by_mode.values():
        for question in questions:
            question.setdefault("answerType", "hand" if question["mode"] == "B" else "percent")
            normalize_question_copy(question)
            normalize_question_choices(question)
            normalize_question_level(question)
    for mode, questions in bank_by_mode.items():
        print(f"モード{mode}: {len(questions):,}問", flush=True)
    bank = [question for questions in bank_by_mode.values() for question in questions]
    validate(bank)
    files = expected_files(bank_by_mode)
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    for path, content in files.items():
        destination = OUTPUT / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8")
    print(f"問題バンク: {len(bank):,}問 / JSON {len(files) - 1}ファイル / 全件検証済み")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
