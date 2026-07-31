#!/usr/bin/env python3
"""フェーズ2用の問題バンクを、固定seedと全列挙で再生成する。"""

from __future__ import annotations

import argparse
import itertools
import json
import random
import sys
from pathlib import Path
from typing import Callable, Iterable

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "question-bank.js"

RANKS = "23456789TJQKA"
SUITS = "cdhs"
DECK = tuple(f"{rank}{suit}" for suit in SUITS for rank in RANKS)
RANK_VALUE = {rank: index + 2 for index, rank in enumerate(RANKS)}
STRAIGHTS = (
    frozenset((14, 2, 3, 4, 5)),
    *(frozenset(range(low, low + 5)) for low in range(2, 11)),
)

CATEGORY_RULES = {
    "flush_draw": {
        "target": "flush",
        "answer": {"flop": "1/3", "turn": "1/6"},
        "distractor": {"flop": "1/4", "turn": "1/3"},
    },
    "oesd": {
        "target": "straight",
        "answer": {"flop": "1/3", "turn": "1/6"},
        "distractor": {"flop": "1/5", "turn": "1/3"},
    },
    "gutshot": {
        "target": "straight",
        "answer": {"flop": "1/6", "turn": "1/12"},
        "distractor": {"flop": "1/3", "turn": "1/6"},
    },
    "combo_gutshot": {
        "target": "flush_or_straight",
        "answer": {"flop": "1/2", "turn": "1/4"},
        "distractor": {"flop": "1/3", "turn": "1/2"},
    },
    "combo_oesd": {
        "target": "flush_or_straight",
        "answer": {"flop": "1/2", "turn": "1/3"},
        "distractor": {"flop": "1/3", "turn": "1/6"},
    },
}


def has_flush_using_hole(hole: tuple[str, ...], board: Iterable[str]) -> bool:
    cards = (*hole, *board)
    return any(
        any(card[1] == suit for card in hole)
        and sum(card[1] == suit for card in cards) >= 5
        for suit in SUITS
    )


def has_straight_using_hole(hole: tuple[str, ...], board: Iterable[str]) -> bool:
    cards = (*hole, *board)
    ranks = {RANK_VALUE[card[0]] for card in cards}
    hole_ranks = {RANK_VALUE[card[0]] for card in hole}
    return any(sequence <= ranks and bool(sequence & hole_ranks) for sequence in STRAIGHTS)


def is_complete(
    hole: tuple[str, ...],
    board: Iterable[str],
    target: str,
) -> bool:
    if target == "flush":
        return has_flush_using_hole(hole, board)
    if target == "straight":
        return has_straight_using_hole(hole, board)
    if target == "flush_or_straight":
        return has_flush_using_hole(hole, board) or has_straight_using_hole(hole, board)
    raise ValueError(f"未対応の完成条件: {target}")


def remaining_deck(hole: tuple[str, ...], board: tuple[str, ...]) -> tuple[str, ...]:
    known = {*hole, *board}
    return tuple(card for card in DECK if card not in known)


def exact_percent(
    hole: tuple[str, ...],
    board: tuple[str, ...],
    target: str,
) -> tuple[int, int, float]:
    deck = remaining_deck(hole, board)
    cards_to_come = 5 - len(board)
    hits = 0
    total = 0

    for runout in itertools.combinations(deck, cards_to_come):
        total += 1
        hits += is_complete(hole, (*board, *runout), target)

    return hits, total, hits / total * 100


def one_card_outs(
    hole: tuple[str, ...],
    board: tuple[str, ...],
    target: str,
) -> frozenset[str]:
    return frozenset(
        card
        for card in remaining_deck(hole, board)
        if is_complete(hole, (*board, card), target)
    )


def all_ranks_are_distinct(cards: Iterable[str]) -> bool:
    cards = tuple(cards)
    return len({card[0] for card in cards}) == len(cards)


def explanation(stage: str, category: str, direct_outs: int) -> str:
    if stage == "preflop":
        return (
            "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると"
            "約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
        )

    street = "ターンとリバー" if stage == "flop" else "リバー"
    if category == "flush_draw":
        return (
            f"同じスートの完成カードは9枚。{street}の全組合せを重複なく数えると"
            f"約{'35.0' if stage == 'flop' else '19.6'}%です。"
        )
    if category == "oesd":
        return (
            f"両端の2ランク、合計8枚が主な完成カードです。{street}までを全列挙すると"
            f"約{'31.5' if stage == 'flop' else '17.4'}%です。"
        )
    if category == "gutshot":
        runner_note = (
            "。フロップではランナーランナーの完成も含めます"
            if stage == "flop"
            else ""
        )
        return (
            f"内側の1ランク、合計4枚が主な完成カードです{runner_note}。"
            f"全列挙では約{'17.9' if stage == 'flop' else '8.7'}%です。"
        )

    draw_name = "ガットショット" if category == "combo_gutshot" else "OESD"
    return (
        f"フラッシュドローと{draw_name}を合わせると、次の1枚で完成するカードは"
        f"重複を除いて{direct_outs}枚。フラッシュとストレートを別々に足さず、"
        f"{street}の全組合せを数えます。"
    )


def build_preflop_questions() -> list[dict[str, object]]:
    suited_hands = (
        ("Ah", "Kh"),
        ("Qs", "Js"),
        ("Td", "9d"),
        ("8c", "7c"),
        ("6h", "5h"),
        ("As", "5s"),
        ("Kc", "Qc"),
        ("Jh", "Th"),
        ("9s", "8s"),
        ("7d", "6d"),
    )
    hits, total, percent = exact_percent(suited_hands[0], (), "flush")
    if round(percent, 1) != 6.4:
        raise RuntimeError(f"プリフロップ検算に失敗: {hits}/{total} = {percent}")

    return [
        {
            "id": f"preflop-flush-{index:02d}",
            "mode": "A",
            "stage": "preflop",
            "hole": list(hole),
            "board": [],
            "target": "flush",
            "trueP": round(percent, 2),
            "answer": "1/20",
            "distractor": "1/10",
            "category": "flush_draw",
            "explain": explanation("preflop", "flush_draw", 0),
        }
        for index, hole in enumerate(suited_hands, start=1)
    ]


def candidate_matches(
    stage: str,
    category: str,
    flush_outs: frozenset[str],
    straight_outs: frozenset[str],
) -> bool:
    counts = (len(flush_outs), len(straight_outs))
    expected = {
        "flush_draw": (9, 0),
        "oesd": (0, 8),
        "gutshot": (0, 4),
        "combo_gutshot": (9, 4),
        "combo_oesd": (9, 8),
    }[category]
    return counts == expected


def expected_rounded_percent(stage: str, category: str) -> float:
    if stage == "flop":
        return {
            "flush_draw": 35.0,
            "oesd": 31.5,
            "gutshot": 17.9,
            "combo_gutshot": 45.8,
            "combo_oesd": 54.1,
        }[category]
    return {
        "flush_draw": 19.6,
        "oesd": 17.4,
        "gutshot": 8.7,
        # 同じカードを二重に数えないため、仕様表の単純加算値より小さくなる。
        "combo_gutshot": 26.1,
        "combo_oesd": 32.6,
    }[category]


def build_postflop_questions(
    stage: str,
    rng: random.Random,
) -> list[dict[str, object]]:
    board_size = 3 if stage == "flop" else 4
    selected: dict[str, list[dict[str, object]]] = {
        category: [] for category in CATEGORY_RULES
    }
    seen_shapes: dict[str, set[tuple[object, ...]]] = {
        category: set() for category in CATEGORY_RULES
    }

    for _attempt in range(400_000):
        cards = rng.sample(DECK, 2 + board_size)
        hole = tuple(cards[:2])
        board = tuple(cards[2:])

        if not all_ranks_are_distinct(cards):
            continue
        if has_flush_using_hole(hole, board) or has_straight_using_hole(hole, board):
            continue

        flush_outs = one_card_outs(hole, board, "flush")
        straight_outs = one_card_outs(hole, board, "straight")

        for category, rule in CATEGORY_RULES.items():
            if len(selected[category]) >= 9:
                continue
            if not candidate_matches(stage, category, flush_outs, straight_outs):
                continue

            # 単なるスート違いだけで9問を埋めないよう、ランク構成も一意にする。
            shape = (
                tuple(sorted(card[0] for card in hole)),
                tuple(sorted(card[0] for card in board)),
            )
            if shape in seen_shapes[category]:
                continue

            target = str(rule["target"])
            hits, total, percent = exact_percent(hole, board, target)
            if round(percent, 1) != expected_rounded_percent(stage, category):
                continue

            direct_outs = len(flush_outs | straight_outs)
            question = {
                "id": f"{stage}-{category}-{len(selected[category]) + 1:02d}",
                "mode": "A",
                "stage": stage,
                "hole": list(hole),
                "board": list(board),
                "target": target,
                "trueP": round(percent, 2),
                "answer": rule["answer"][stage],
                "distractor": rule["distractor"][stage],
                "category": category,
                "explain": explanation(stage, category, direct_outs),
            }
            selected[category].append(question)
            seen_shapes[category].add(shape)

        if all(len(questions) == 9 for questions in selected.values()):
            break
    else:
        missing = {
            category: 9 - len(questions)
            for category, questions in selected.items()
            if len(questions) < 9
        }
        raise RuntimeError(f"{stage} の候補が不足しています: {missing}")

    # 同カテゴリが固まらない順番にして、生成物を目視しやすくする。
    return [
        selected[category][index]
        for index in range(9)
        for category in CATEGORY_RULES
    ]


def validate_bank(bank: list[dict[str, object]]) -> None:
    if len(bank) != 100:
        raise RuntimeError(f"問題数が100問ではありません: {len(bank)}")
    if len({question["id"] for question in bank}) != len(bank):
        raise RuntimeError("問題IDが重複しています")

    stage_counts = {
        stage: sum(question["stage"] == stage for question in bank)
        for stage in ("preflop", "flop", "turn")
    }
    if stage_counts != {"preflop": 10, "flop": 45, "turn": 45}:
        raise RuntimeError(f"ステージ比率が不正です: {stage_counts}")

    for question in bank:
        true_percent = float(question["trueP"])
        answer_percent = parse_fraction(str(question["answer"]))
        distractor_percent = parse_fraction(str(question["distractor"]))
        if abs(true_percent - answer_percent) >= abs(true_percent - distractor_percent):
            raise RuntimeError(f"誤答のほうが近い問題です: {question['id']}")
        ratio = max(answer_percent, distractor_percent) / min(
            answer_percent, distractor_percent
        )
        if ratio < 1.3:
            raise RuntimeError(f"選択肢が近すぎます: {question['id']}")


def parse_fraction(value: str) -> float:
    numerator, denominator = value.split("/")
    return int(numerator) / int(denominator) * 100


def render_bank(bank: list[dict[str, object]]) -> str:
    payload = json.dumps(bank, ensure_ascii=False, indent=2)
    return (
        "/* scripts/generate_question_bank.py から生成。直接編集しないでください。 */\n"
        "(function attachQuestionBank(root) {\n"
        f"  const questions = {payload};\n"
        "  const bank = Object.freeze(questions.map((question) => Object.freeze(question)));\n"
        "\n"
        '  if (typeof module === "object" && module.exports) {\n'
        "    module.exports = bank;\n"
        "  }\n"
        "\n"
        "  if (root) {\n"
        "    root.QUESTION_BANK = bank;\n"
        "  }\n"
        '})(typeof globalThis !== "undefined" ? globalThis : this);\n'
    )


def build_bank() -> list[dict[str, object]]:
    rng = random.Random(20260731)
    bank = [
        *build_preflop_questions(),
        *build_postflop_questions("flop", rng),
        *build_postflop_questions("turn", rng),
    ]
    validate_bank(bank)
    return bank


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="生成せず、現在の問題バンクが再生成結果と一致するか検査する",
    )
    args = parser.parse_args()

    rendered = render_bank(build_bank())
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != rendered:
            print(f"{OUTPUT.relative_to(ROOT)} は再生成が必要です", file=sys.stderr)
            return 1
        print("問題バンク: 100問、全件検証済み")
        return 0

    OUTPUT.write_text(rendered, encoding="utf-8")
    print(f"{OUTPUT.relative_to(ROOT)} に100問を書き出しました")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
