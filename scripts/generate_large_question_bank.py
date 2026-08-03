#!/usr/bin/env python3
"""20,000問を生成し、用途別の100問JSONへ分割する。"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
import random
import shutil
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "questions"
RANKS = "23456789TJQKA"
SUITS = "cdhs"
SUIT_NAMES = {"c": "クラブ", "d": "ダイヤ", "h": "ハート", "s": "スペード"}
DECK = tuple(f"{rank}{suit}" for rank in RANKS for suit in SUITS)
RANK_VALUE = {rank: index + 2 for index, rank in enumerate(RANKS)}
DISPLAY_RANK = {"T": "10"}
BUCKETS = (0, 1, 2, 3, 5, 7.5, 10, 12.5, 15, 17.5, 20, *range(25, 101, 5))
LEGACY_MODE_COUNTS = {"A": 6000, "B": 3000, "C": 338, "D": 662}
MODE_COUNTS = {"A": 10_000, "B": 4800, "C": 1200, "D": 4000}
HAND_NAMES = ("ハイカード", "ワンペア", "ツーペア", "スリー", "ストレート", "フラッシュ", "フルハウス", "フォーカード", "ストレートフラッシュ")
A_COUNTS = {
    "flush": 1400,
    "straight": 1600,
    "flush_or_straight": 800,
    "rank_hit": 550,
    "rank_trips": 500,
    "two_pair": 400,
    "full_house": 400,
    "four_kind": 250,
    "straight_flush": 100,
}
NEW_A_COUNTS = {
    "runner_straight": 700,
    "runner_flush": 650,
    "runner_flush_or_straight": 350,
    "board_pair": 350,
    "board_two_pair": 300,
    "overcard": 400,
    "four_flush_board": 350,
    "pocket_pair_counterfeit": 350,
    "two_pair_counterfeit": 300,
    "same_hand_category": 250,
}
NEW_B_COUNTS = {
    "tie_probability": 300,
    "trailing_hand_wins": 300,
    "clean_out": 225,
    "next_card_reversal": 225,
    "board_straight_chop": 225,
    "board_flush_chop": 225,
    "leading_hand_holds": 300,
}
NEW_D_COUNTS = {
    "opponent_pocket_pair": 209,
    "opponent_overpair": 209,
    "opponent_set": 209,
    "opponent_top_pair_plus": 209,
    "opponent_two_pair": 209,
    "opponent_straight": 209,
    "opponent_flush": 209,
    "opponent_oesd": 209,
    "opponent_gutshot": 209,
    "opponent_flush_draw": 209,
    "opponent_combo_draw": 208,
    "opponent_higher_flush": 208,
    "opponent_same_pair_higher_kicker": 208,
    "all_opponents_miss_board": 208,
    "exactly_one_opponent_target_rank": 208,
    "multiple_opponents_target_rank": 208,
}


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


def build_a_state(category: str, rng: random.Random, force_zero: bool):
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
        suited = rng.sample([f"{rank}{suit}" for rank in RANKS], 4 if not force_zero else 3)
        hole = tuple(suited[:2])
        board_start = tuple(suited[2:])
        if force_zero:
            stage = "turn"
            board_size = 4
        board = (*board_start, *draw_cards(rng, board_size - len(board_start), set(suited)))
        return stage, hole, board, None
    if category == "straight":
        sequence = straight_sequence(rng)
        present_count = 3 if (force_zero or stage == "flop" and rng.random() < 0.28) else 4
        ranks = rng.sample(sequence, present_count)
        known = []
        for rank in ranks:
            known.append(f"{rank}{rng.choice(SUITS)}")
        if force_zero:
            stage = "turn"
            board_size = 4
            present_count = 3
            known = known[:3]
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
    if value == 0:
        return copy[0], "残りのカード枚数では、必要なカードをすべてそろえられません。"
    if category == "flush_or_straight":
        return copy[0], "複数の役を同時に待つ形（コンボドロー）で、重なるカードは一度だけ数えます。"
    if category == "straight":
        if (stage == "flop" and value >= 25) or (stage == "turn" and value >= 14):
            return copy[0], "両端を待つ形（OESD）や、内側の待ちが2種類ある形（ダブルガット）です。"
        if value >= 8:
            return copy[0], "内側の1種類だけを待つ形（ガットショット）です。"
        return copy[0], "残り2枚が両方そろって完成する形（ランナーランナー）です。"
    if category == "flush" and stage == "flop" and value < 10:
        return copy[0], "残り2枚が両方同じマークになる形（バックドア）です。"
    if category == "straight" and stage == "flop" and value < 10:
        return copy[0], "残り2枚が両方そろって完成する形（ランナーランナー）です。"
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
    zero_budget = 100
    for category, count in A_COUNTS.items():
        category_questions = []
        attempts = 0
        while len(category_questions) < count:
            attempts += 1
            if attempts > count * 3000:
                raise RuntimeError(f"A/{category} の生成候補が不足")
            force_zero = category in {"flush", "straight"} and zero_budget > 0 and len(category_questions) < (60 if category == "flush" else 40)
            stage, hole, board, target_rank = build_a_state(category, rng, force_zero)
            if len(set((*hole, *board))) != len(hole) + len(board):
                continue
            if target_complete(hole, board, category, target_rank):
                continue
            key = f"{category}:{target_rank}:{stage}:{canonical_cards([list(hole), list(board)])}"
            if key in seen:
                continue
            value = round(exact_target_percent(hole, board, category, target_rank), 2)
            if force_zero and value != 0:
                continue
            if not force_zero and value == 0:
                continue
            answer = percent_label(nearest_bucket(value))
            wrong, model = distractor(value, category, stage)
            prompt, explain = prompt_and_explanation(category, target_rank, stage, value)
            question = {
                "id": f"a-{len(questions) + len(category_questions) + 1:05d}",
                "mode": "A", "stage": stage, "hole": list(hole), "board": list(board),
                "target": category, "trueP": value, "answer": answer, "distractor": wrong,
                "category": category, "prompt": prompt, "explain": explain,
                "difficulty": "hard" if value == 0 or rng.random() < 0.3 else "medium",
                "distractorModel": model, "conceptKey": key,
            }
            if target_rank:
                question["targetRank"] = target_rank
            category_questions.append(question)
            seen.add(key)
            if value == 0:
                zero_budget -= 1
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


def comparison_profile(hands: tuple[tuple[str, str], tuple[str, str]], board: tuple[str, ...], equities: list[float]):
    current_scores = [evaluate((*hand, *board))[0] for hand in hands]
    if not board:
        first_ranks = {card[0] for card in hands[0]}
        second_ranks = {card[0] for card in hands[1]}
        factors = {
            "pair_matchup" if any(hand[0][0] == hand[1][0] for hand in hands) else "high_cards",
        }
        if first_ranks & second_ranks:
            factors.add("domination")
        if any(hand[0][1] == hand[1][1] for hand in hands):
            factors.add("suitedness")
    else:
        factors = {"made_hand" if current_scores[0] != current_scores[1] else "kicker"}
        remaining = [card for card in DECK if card not in {*hands[0], *hands[1], *board}]
        for hand in hands:
            if any(has_flush_using_hole(hand, (*board, card)) for card in remaining):
                factors.add("flush_draw")
            if any(has_straight_using_hole(hand, (*board, card)) for card in remaining):
                factors.add("straight_draw")
        if len({card[0] for card in board}) < len(board):
            factors.add("paired_board")
    best = max(equities)
    category_gap = abs(current_scores[0] - current_scores[1])
    obvious = (
        (not board and best >= 85)
        or (bool(board) and best >= 95 and category_gap >= 1 and len(factors) == 1)
        or (bool(board) and best >= 90 and category_gap >= 2 and len(factors) <= 2)
    )
    difficulty = "hard" if len(factors) >= 2 or best <= 60 else "medium"
    explanation = (
        "手札のペア、高いカード、同じマークかを比べます。"
        if not board
        else f"現在は{HAND_NAMES[current_scores[0]]}と{HAND_NAMES[current_scores[1]]}。残りのドローとキッカーも比べます。"
    )
    return obvious, difficulty, explanation, "+".join(sorted(factors))


def build_mode_b(rng: random.Random) -> list[dict]:
    questions = []
    seen = set()
    stage_counts = {"preflop": 700, "flop": 1150, "turn": 1150}
    for stage, count in stage_counts.items():
        board_size = {"preflop": 0, "flop": 3, "turn": 4}[stage]
        while sum(question["stage"] == stage for question in questions) < count:
            cards = tuple(rng.sample(DECK, 4 + board_size))
            hands = (cards[:2], cards[2:4])
            board = cards[4:]
            key = f"{stage}:{canonical_cards([list(hands[0]), list(hands[1]), list(board)])}"
            if key in seen:
                continue
            equities = equity(hands, board, rng, 12_000 if stage == "preflop" else None)
            winner = 0 if equities[0] > equities[1] else 1
            best = equities[winner]
            if best < 51:
                continue
            obvious, difficulty, explain, factors = comparison_profile(hands, board, equities)
            if obvious:
                continue
            questions.append({
                "id": f"b-{len(questions) + 1:05d}", "mode": "B", "stage": stage,
                "hands": [list(hand) for hand in hands], "board": list(board),
                "equities": equities, "trueP": best, "answer": winner,
                "category": "hand_comparison", "prompt": "勝率が高いのは？",
                "explain": explain, "difficulty": difficulty,
                "distractorModel": f"比較要素の一部だけを過大評価する: {factors}", "conceptKey": key,
            })
            seen.add(key)
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
        for players in (2, 6)
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
    stage_counts = {"preflop": 156, "flop": 253, "turn": 253}
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
    if category in {"runner_straight", "runner_flush_or_straight"}:
        straight = has_straight_using_hole(hole, final_board)
        return straight if category == "runner_straight" else straight or has_flush_using_hole(hole, final_board)
    if category == "runner_flush":
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


def build_new_a_state(category: str, rng: random.Random):
    if category in {"runner_straight", "runner_flush_or_straight"}:
        while True:
            cards = tuple(rng.sample(DECK, 5))
            hole, board = cards[:2], cards[2:]
            if has_straight_using_hole(hole, board):
                continue
            remaining = [card for card in DECK if card not in cards]
            has_one_card_straight = any(has_straight_using_hole(hole, (*board, card)) for card in remaining)
            has_one_card_flush = any(has_flush_using_hole(hole, (*board, card)) for card in remaining)
            if not has_one_card_straight and (category == "runner_straight" or not has_one_card_flush):
                return "flop", hole, board
    if category == "runner_flush":
        suit = rng.choice(SUITS)
        suited = rng.sample([f"{rank}{suit}" for rank in RANKS], 3)
        hole = (suited[0], rng.choice([card for card in DECK if card not in suited and card[1] != suit]))
        filler = rng.choice([card for card in DECK if card not in {*hole, *suited} and card[1] != suit])
        board = (suited[1], suited[2], filler)
        return "flop", hole, board
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
    "runner_straight": ("ストレートの確率は？", "残り2枚が両方必要な形（ランナーランナー）です。"),
    "runner_flush": ("フラッシュの確率は？", "残り2枚が両方必要な形（ランナーランナー）です。"),
    "runner_flush_or_straight": ("ストレートかフラッシュの確率は？", "どちらも残り2枚が必要で、重なる組合せは一度だけ数えます。"),
    "board_pair": ("ボードにペアができる確率は？", "ボード上で同じ数字や文字が2枚以上になる可能性です。"),
    "board_two_pair": ("ボードがツーペアになる確率は？", "ボード上で異なる2種類の数字や文字がペアになる可能性です。"),
    "overcard": ("手札のペアより高いカードの確率は？", "ポケットペアより強いカードが出る可能性です。"),
    "pocket_pair_counterfeit": ("手札のペアが使われなくなる確率は？", "ボードの役が強くなり、ポケットペアがベスト5枚から外れる可能性です。"),
    "two_pair_counterfeit": ("低いペアが使われなくなる確率は？", "ボードの変化で現在のツーペアが弱くなる可能性です。"),
    "same_hand_category": ("今の役のまま終わる確率は？", "役の種類が変わらない可能性です。"),
}


def new_a_copy(category: str, target_suit: str | None = None) -> tuple[str, str]:
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
            if category == "four_flush_board":
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
            prompt, explain = new_a_copy(category, target_suit)
            fields = answer_fields(value, "残り枚数、重複する組合せ、ボードの変化のどれかを見落とす")
            question = {
                "id": f"a-{LEGACY_MODE_COUNTS['A'] + len(questions) + 1:05d}",
                "mode": "A", "stage": stage, "hole": list(hole), "board": list(board),
                "target": category, "category": category, "prompt": prompt, "explain": explain,
                "difficulty": "hard" if category in {"runner_flush_or_straight", "pocket_pair_counterfeit", "two_pair_counterfeit"} or rng.random() < .2 else "medium",
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


def next_card_reversal_percent(hands, board, leader, trailer) -> float:
    known = {card for hand in hands for card in hand} | set(board)
    remaining = tuple(card for card in DECK if card not in known)
    hits = sum(
        evaluate((*hands[trailer], *board, card))
        > evaluate((*hands[leader], *board, card))
        for card in remaining
    )
    return hits / len(remaining) * 100


NEW_B_COPY = {
    "tie_probability": ("引き分けになる確率は？", "両方のベスト5枚が同じになる組合せです。"),
    "clean_out": ("最後の1枚で逆転する確率は？", "負けている側を逆転勝ちさせるカードを、クリーンアウトと呼びます。"),
    "next_card_reversal": (
        "次のカードで役の強さが逆転する確率は？",
        "現在負けている側が、次のカード直後に相手より強い役になる可能性です。",
    ),
    "board_straight_chop": (
        "ボードの5枚だけでストレートになり、引き分ける確率は？",
        "最後にボードの5枚だけでストレートができ、左右の手札が同じ役になる可能性です。",
    ),
    "board_flush_chop": (
        "ボードの5枚だけでフラッシュになり、引き分ける確率は？",
        "最後にボードの5枚だけでフラッシュができ、左右の手札が同じ役になる可能性です。",
    ),
}


def mode_b_copy(category: str, leader: int | None = None) -> tuple[str, str, int | None]:
    if category in {"trailing_hand_wins", "leading_hand_holds"}:
        if leader not in {0, 1}:
            raise ValueError(f"左右を特定できません: {category}")
        target_hand = leader if category == "leading_hand_holds" else 1 - leader
        side = "左" if target_hand == 0 else "右"
        current_state = "強く、そのまま最後まで勝つ" if category == "leading_hand_holds" else "弱く、最後に逆転して勝つ"
        return (
            f"{side}の手札の勝率は？",
            f"今は{side}の手札が{current_state}可能性です。",
            target_hand,
        )
    prompt, explain = NEW_B_COPY[category]
    return prompt, explain, None


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
            stage = "turn" if category == "clean_out" else "flop" if category == "next_card_reversal" else rng.choice(("flop", "turn"))
            board_size = 3 if stage == "flop" else 4
            if category == "board_straight_chop":
                stage = "flop"
                sequence = straight_sequence(rng)
                board_ranks = rng.sample(sequence, 3)
                board = tuple(f"{rank}{rng.choice(SUITS)}" for rank in board_ranks)
                while len(set(board)) != 3:
                    board = tuple(f"{rank}{rng.choice(SUITS)}" for rank in board_ranks)
                hand_cards = draw_cards(rng, 4, set(board))
                hands = (hand_cards[:2], hand_cards[2:])
            elif category == "board_flush_chop":
                stage = "flop"
                suit = rng.choice(SUITS)
                board = tuple(rng.sample([f"{rank}{suit}" for rank in RANKS], 3))
                hand_cards = tuple(rng.sample([card for card in DECK if card not in board and card[1] != suit], 4))
                hands = (hand_cards[:2], hand_cards[2:])
            else:
                cards = tuple(rng.sample(DECK, 4 + board_size))
                hands = (cards[:2], cards[2:4])
                board = cards[4:]
            current = [evaluate((*hand, *board)) for hand in hands]
            leader = 0 if current[0] > current[1] else 1 if current[1] > current[0] else None
            trailer = None if leader is None else 1 - leader
            if category in {"trailing_hand_wins", "clean_out", "next_card_reversal", "leading_hand_holds"} and leader is None:
                continue

            def predicate(scores, final_board, runout):
                if category == "tie_probability":
                    return scores[0] == scores[1]
                if category in {"trailing_hand_wins", "clean_out"}:
                    return scores[trailer] > scores[leader]
                if category == "leading_hand_holds":
                    return scores[leader] > scores[trailer]
                board_score = evaluate(tuple(final_board))
                if scores[0] != scores[1] or scores[0] != board_score:
                    return False
                return board_score[0] == (4 if category == "board_straight_chop" else 5)

            if category == "next_card_reversal":
                value = next_card_reversal_percent(hands, board, leader, trailer)
            else:
                value = outcome_percent(hands, board, predicate)
            if not 0.5 <= value <= 99.5:
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
        while sum(entry[2] == players for entry in entries) < 431:
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
    if category == "opponent_straight":
        return score[0] == 4 and has_straight_using_hole(hand, board)
    if category == "opponent_flush":
        return score[0] == 5 and has_flush_using_hole(hand, board)
    if category == "opponent_oesd":
        return opponent_draw_kind(hand, board) == "oesd"
    if category == "opponent_gutshot":
        return opponent_draw_kind(hand, board) == "gutshot"
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
    "opponent_oesd": (
        "がストレートの両端待ちの確率は？",
        "並びの左右どちらの数字が出てもストレートになる形です。この両端待ちをOESDと呼びます。",
    ),
    "opponent_gutshot": (
        "がストレートの内側待ちの確率は？",
        "並びの内側にある1種類の数字を引けばストレートになる形です。一般にガットショットと呼びます。",
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


def build_new_mode_d(rng: random.Random) -> list[dict]:
    questions = []
    seen = set()
    for category, count in NEW_D_COUNTS.items():
        made = 0
        attempts = 0
        while made < count:
            attempts += 1
            if attempts > count * 3000:
                raise RuntimeError(f"D/{category} の生成候補が不足")
            stage, hole, board = build_new_d_state(category, rng)
            players = 6 if category == "multiple_opponents_target_rank" else 2 if made % 2 == 0 else 6
            target_rank = rng.choice(RANKS) if category.endswith("target_rank") else None
            value = opponent_property_percent(category, hole, board, target_rank, players, rng)
            if not 0.5 <= value <= 99.5:
                continue
            key = f"{category}:{players}:{target_rank}:{stage}:{canonical_cards([list(hole), list(board)])}"
            if key in seen:
                continue
            prompt, explain = mode_d_copy(category, players, target_rank, board)
            fields = answer_fields(value, "相手人数、見えているカード、ボードだけの役のいずれかを数え違える")
            question = {
                "id": f"d-{LEGACY_MODE_COUNTS['D'] + len(questions) + 1:04d}",
                "mode": "D", "stage": stage, "hole": list(hole), "board": list(board),
                "playerCount": players, "category": category, "prompt": prompt, "explain": explain,
                "difficulty": "hard" if players == 6 or category in {"opponent_combo_draw", "opponent_higher_flush", "opponent_same_pair_higher_kicker"} else "medium",
                "conceptKey": key, **fields,
            }
            if target_rank:
                question["targetRank"] = target_rank
            questions.append(question)
            seen.add(key)
            made += 1
        print(f"  D/{category}: {made}問", flush=True)
    return questions


def validate(bank: list[dict]) -> None:
    if len(bank) != 20_000:
        raise RuntimeError(f"問題数が20,000問ではありません: {len(bank)}")
    mode_counts = Counter(question["mode"] for question in bank)
    if dict(mode_counts) != MODE_COUNTS:
        raise RuntimeError(f"モード比率が不正です: {mode_counts}")
    if len({question["id"] for question in bank}) != len(bank):
        raise RuntimeError("問題IDが重複しています")
    if len({question["conceptKey"] for question in bank}) != len(bank):
        raise RuntimeError("スート同型を含む問題構造が重複しています")
    for question in bank:
        if question.get("category") in {"nut_flush", "same_final_category"}:
            raise RuntimeError(f"廃止した問題カテゴリです: {question['id']}")
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
            if question.get("targetHand") != expected_target:
                raise RuntimeError(f"勝率の対象手札が不正です: {question['id']}")
            side = "左" if expected_target == 0 else "右"
            if question["prompt"] != f"{side}の手札の勝率は？":
                raise RuntimeError(f"勝率の対象が問題文と不一致です: {question['id']}")
        if question.get("category") == "next_card_reversal":
            hands = tuple(tuple(hand) for hand in question["hands"])
            board = tuple(question["board"])
            current = [evaluate((*hand, *board)) for hand in hands]
            if current[0] == current[1]:
                raise RuntimeError(f"次カード逆転問題の開始時点が同点です: {question['id']}")
            leader = 0 if current[0] > current[1] else 1
            trailer = 1 - leader
            expected = round(next_card_reversal_percent(hands, board, leader, trailer), 2)
            if question["stage"] != "flop" or question["trueP"] != expected:
                raise RuntimeError(f"次カード逆転率が不正です: {question['id']}")
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
        if question["mode"] == "D" and not question["prompt"].startswith(f"{question['playerCount']}人卓で"):
            raise RuntimeError(f"卓人数なし: {question['id']}")


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
        "version": "", "total": 20_000, "batchSize": 100,
        "modes": {mode: {"count": len(questions)} for mode, questions in bank_by_mode.items()},
        "groups": {
            "A": {"count": 10_000, "files": 100, "path": "a"},
            "BC": {"count": 6000, "files": 60, "path": "bc"},
            "D": {"count": 4000, "files": 40, "path": "d"},
        },
    }
    digest = hashlib.sha256()
    classic_b = [question for question in bank_by_mode["B"] if question["answerType"] == "hand"]
    numeric_b = [question for question in bank_by_mode["B"] if question["answerType"] == "percent"]
    group_chunks = {
        "a": spread_questions(bank_by_mode["A"], 100),
        "bc": [
            [*classic, *numeric, *mode_c]
            for classic, numeric, mode_c in zip(
                spread_questions(classic_b, 60),
                spread_questions(numeric_b, 60),
                spread_questions(bank_by_mode["C"], 60),
                strict=True,
            )
        ],
        "d": spread_questions(bank_by_mode["D"], 40),
    }
    for group, chunks in group_chunks.items():
        for index, chunk in enumerate(chunks, 1):
            if len(chunk) != 100:
                raise RuntimeError(f"{group}/{index:04d}.json が100問ではありません")
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
    for group, expected_count in (("a", 10_000), ("bc", 6000), ("d", 4000)):
        paths = sorted((OUTPUT / group).glob("*.json"))
        if len(paths) != expected_count // 100:
            raise RuntimeError(f"グループ{group}のJSON数が不正です")
        for path in paths:
            chunk = json.loads(path.read_text(encoding="utf-8"))
            if len(chunk) != 100:
                raise RuntimeError(f"{path.relative_to(ROOT)} の問題数が不正です")
            questions.extend(chunk)
    bank = questions
    validate(bank)
    mode_counts = Counter(question["mode"] for question in bank)
    if manifest.get("total") != len(bank) or manifest.get("modes") != {
        mode: {"count": count} for mode, count in MODE_COUNTS.items()
    } or dict(mode_counts) != MODE_COUNTS:
        raise RuntimeError("manifest.json が問題データと一致しません")
    print(f"問題バンク: {len(bank):,}問 / JSON 200ファイル / 全件検証済み")
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
    limits = {"A": 6000, "B": 3000, "C": 338, "D": 662}
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
    additions = {}
    for mode, builder, seed in (
        ("A", build_new_mode_a, 2026081201),
        ("B", build_new_mode_b, 2026081202),
        ("C", build_new_mode_c, 2026081203),
        ("D", build_new_mode_d, 2026081204),
    ):
        cache_version = {"A": "-v5", "B": "-v6", "D": "-v2"}.get(mode, "")
        cache_path = Path("/tmp") / f"anzan-poker-new-{mode.lower()}{cache_version}.json"
        if cache_path.exists():
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            expected = MODE_COUNTS[mode] - LEGACY_MODE_COUNTS[mode]
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
