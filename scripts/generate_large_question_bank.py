#!/usr/bin/env python3
"""10,000問を生成し、モード別の100問JSONへ分割する。"""

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
DECK = tuple(f"{rank}{suit}" for rank in RANKS for suit in SUITS)
RANK_VALUE = {rank: index + 2 for index, rank in enumerate(RANKS)}
DISPLAY_RANK = {"T": "10"}
BUCKETS = (0, 1, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, *range(25, 101, 5))
MODE_COUNTS = {"A": 6000, "B": 3000, "C": 338, "D": 662}
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


def display_rank(rank: str) -> str:
    return DISPLAY_RANK.get(rank, rank)


def nearest_bucket(value: float) -> float:
    return min(BUCKETS, key=lambda bucket: (abs(bucket - value), -bucket))


def percent_label(value: float) -> str:
    return f"{value:g}%"


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
        "flush": ("フラッシュの確率は？", "同じスートが5枚そろう可能性です。"),
        "straight": ("ストレートの確率は？", "連続する5ランクがそろう可能性です。"),
        "flush_or_straight": ("フラッシュかストレートの確率は？", "2種類の待ちで重なるカードは一度だけ数えます。"),
        "rank_hit": (f"{rank}が出る確率は？", f"見えていない{rank}の枚数から考えます。"),
        "rank_trips": (f"{rank}がスリーになる確率は？", "同じランクが3枚になる可能性です。"),
        "two_pair": ("ツーペアの確率は？", "異なる2つのペアができる可能性です。"),
        "full_house": ("フルハウスの確率は？", "スリーとペアが同時にできる可能性です。"),
        "four_kind": ("フォーカードの確率は？", "同じランクが4枚そろう可能性です。"),
        "straight_flush": ("ストレートフラッシュの確率は？", "同じスートで連続する5ランクがそろう可能性です。"),
    }[category]
    if value == 0:
        return copy[0], "残りのカード枚数では、必要なカードをすべてそろえられません。"
    if category == "flush_or_straight":
        return copy[0], "複数の役を同時に待つ形（コンボドロー）で、重なるカードは一度だけ数えます。"
    if category == "straight":
        if (stage == "flop" and value >= 25) or (stage == "turn" and value >= 14):
            return copy[0], "両端を待つ形（OESD）や、内側の待ちが2種類ある形（ダブルガット）です。"
        if value >= 8:
            return copy[0], "内側の1ランクだけを待つ形（ガットショット）です。"
        return copy[0], "残り2枚が両方そろって完成する形（ランナーランナー）です。"
    if category == "flush" and stage == "flop" and value < 10:
        return copy[0], "残り2枚が両方同じスートになる形（バックドア）です。"
    if category == "straight" and stage == "flop" and value < 10:
        return copy[0], "残り2枚が両方そろって完成する形（ランナーランナー）です。"
    return copy


def distractor(value: float, category: str, stage: str) -> tuple[str, str]:
    correct = nearest_bucket(value)
    if value == 0:
        return percent_label(2.5), "残り枚数を確認せず、わずかなアウツがあると考える"
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
    if correct <= 2.5:
        wrong = 5 if correct != 5 else 2.5
    elif correct <= 10:
        wrong = correct + 5
    elif correct <= 25:
        wrong = correct - 7.5 if stage == "turn" else correct + 10
    elif correct <= 65:
        wrong = correct - 15
    else:
        wrong = correct - 15
    wrong = nearest_bucket(max(0, min(100, wrong)))
    if wrong == correct:
        wrong = nearest_bucket(max(0, correct - 10))
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
        "手札のペア、高いカード、同じスートかを比べます。"
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
                "category": "hand_comparison", "prompt": "どちらが強い？",
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
    wrong = nearest_bucket(max(0, min(100, wrong)))
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
            wrong = nearest_bucket(naive)
            if wrong == correct:
                wrong = nearest_bucket(correct + (10 if correct < 50 else -10))
            rank = display_rank(target_rank)
            questions.append({
                "id": f"d-{len(questions) + 1:04d}", "mode": "D", "stage": stage,
                "hole": list(hole), "board": list(board), "targetRank": target_rank,
                "playerCount": players, "trueP": value, "answer": percent_label(correct),
                "distractor": percent_label(wrong), "category": "opponent_rank",
                "prompt": f"{'相手' if players == 2 else 'ほかの誰か'}が{rank}を持つ確率は？",
                "explain": f"見えていない{rank}と、相手に配られる枚数から考えます。",
                "difficulty": "hard" if players == 6 or rng.random() < 0.2 else "medium",
                "distractorModel": model, "conceptKey": key,
            })
            seen.add(key)
    return questions


def validate(bank: list[dict]) -> None:
    if len(bank) != 10_000:
        raise RuntimeError(f"問題数が10,000問ではありません: {len(bank)}")
    mode_counts = Counter(question["mode"] for question in bank)
    if dict(mode_counts) != MODE_COUNTS:
        raise RuntimeError(f"モード比率が不正です: {mode_counts}")
    if len({question["id"] for question in bank}) != len(bank):
        raise RuntimeError("問題IDが重複しています")
    if len({question["conceptKey"] for question in bank}) != len(bank):
        raise RuntimeError("スート同型を含む問題構造が重複しています")
    for question in bank:
        cards = question.get("hole", []) + question.get("board", [])
        cards += [card for hand in question.get("hands", []) for card in hand]
        if len(cards) != len(set(cards)):
            raise RuntimeError(f"カード重複: {question['id']}")
        if not question.get("distractorModel"):
            raise RuntimeError(f"誤答理由なし: {question['id']}")
        if question["mode"] != "B" and question["answer"] == question["distractor"]:
            raise RuntimeError(f"選択肢重複: {question['id']}")


def render_json(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"


def expected_files(bank_by_mode: dict[str, list[dict]]) -> dict[Path, str]:
    files = {}
    manifest = {"version": "", "total": 10_000, "batchSize": 100, "modes": {}}
    digest = hashlib.sha256()
    for mode, questions in bank_by_mode.items():
        shuffled = sorted(questions, key=lambda question: hashlib.sha256(question["id"].encode()).digest())
        chunks = [shuffled[index:index + 100] for index in range(0, len(shuffled), 100)]
        manifest["modes"][mode] = {"count": len(questions), "files": len(chunks)}
        for index, chunk in enumerate(chunks, 1):
            path = Path(mode.lower()) / f"{index:04d}.json"
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
    bank_by_mode = {}
    for mode, expected_count in MODE_COUNTS.items():
        paths = sorted((OUTPUT / mode.lower()).glob("*.json"))
        expected_files_count = math.ceil(expected_count / 100)
        if len(paths) != expected_files_count:
            raise RuntimeError(f"モード{mode}のJSON数が不正です")
        questions = []
        for index, path in enumerate(paths):
            chunk = json.loads(path.read_text(encoding="utf-8"))
            expected_size = 100 if index < len(paths) - 1 else expected_count - 100 * index
            if len(chunk) != expected_size:
                raise RuntimeError(f"{path.relative_to(ROOT)} の問題数が不正です")
            questions.extend(chunk)
        bank_by_mode[mode] = questions
    bank = [question for questions in bank_by_mode.values() for question in questions]
    validate(bank)
    if manifest.get("total") != len(bank) or manifest.get("modes") != {
        mode: {"count": len(questions), "files": math.ceil(len(questions) / 100)}
        for mode, questions in bank_by_mode.items()
    }:
        raise RuntimeError("manifest.json が問題データと一致しません")
    print(f"問題バンク: {len(bank):,}問 / JSON 101ファイル / 全件検証済み")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        return check_output()
    rng = random.Random(20260802)
    bank_by_mode = {}
    for mode, builder in (("A", build_mode_a), ("B", build_mode_b), ("C", build_mode_c), ("D", build_mode_d)):
        bank_by_mode[mode] = builder(rng)
        print(f"モード{mode}: {len(bank_by_mode[mode]):,}問", flush=True)
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
