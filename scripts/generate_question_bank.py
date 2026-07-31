#!/usr/bin/env python3
"""フェーズ2用の問題バンクを、固定seedと全列挙で再生成する。"""

from __future__ import annotations

import argparse
import itertools
import json
import random
import sys
from pathlib import Path
from typing import Iterable

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
        "answer": {"flop": "35%", "turn": "20%"},
        "distractor": {"flop": "20%", "turn": "35%"},
    },
    "oesd": {
        "target": "straight",
        "answer": {"flop": "30%", "turn": "15%"},
        "distractor": {"flop": "15%", "turn": "30%"},
    },
    "gutshot": {
        "target": "straight",
        "answer": {"flop": "20%", "turn": "10%"},
        "distractor": {"flop": "35%", "turn": "20%"},
    },
    "combo_gutshot": {
        "target": "flush_or_straight",
        "answer": {"flop": "45%", "turn": "25%"},
        "distractor": {"flop": "30%", "turn": "45%"},
    },
    "combo_oesd": {
        "target": "flush_or_straight",
        "answer": {"flop": "55%", "turn": "35%"},
        "distractor": {"flop": "35%", "turn": "20%"},
    },
}
FOCUSED_RANKS = ("A", "K", "Q", "J", "T")
FILLER_CARDS = ("2c", "7s", "Jh", "4d", "9c", "3h", "8d", "5s")


def display_rank(rank: str) -> str:
    return "10" if rank == "T" else rank


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


def board_contains_rank(board: Iterable[str], target_rank: str) -> bool:
    return any(card[0] == target_rank for card in board)


def has_three_of_a_kind_using_hole(
    hole: tuple[str, ...],
    board: Iterable[str],
    target_rank: str,
) -> bool:
    cards = (*hole, *board)
    return (
        any(card[0] == target_rank for card in hole)
        and sum(card[0] == target_rank for card in cards) >= 3
    )


def is_complete(
    hole: tuple[str, ...],
    board: Iterable[str],
    target: str,
    target_rank: str | None = None,
) -> bool:
    if target == "flush":
        return has_flush_using_hole(hole, board)
    if target == "straight":
        return has_straight_using_hole(hole, board)
    if target == "flush_or_straight":
        return has_flush_using_hole(hole, board) or has_straight_using_hole(hole, board)
    if target == "rank_on_board" and target_rank is not None:
        return board_contains_rank(board, target_rank)
    if target == "three_of_a_kind" and target_rank is not None:
        return has_three_of_a_kind_using_hole(hole, board, target_rank)
    raise ValueError(f"未対応の完成条件: {target}")


def remaining_deck(hole: tuple[str, ...], board: tuple[str, ...]) -> tuple[str, ...]:
    known = {*hole, *board}
    return tuple(card for card in DECK if card not in known)


def exact_percent(
    hole: tuple[str, ...],
    board: tuple[str, ...],
    target: str,
    target_rank: str | None = None,
) -> tuple[int, int, float]:
    deck = remaining_deck(hole, board)
    cards_to_come = 5 - len(board)
    hits = 0
    total = 0

    for runout in itertools.combinations(deck, cards_to_come):
        total += 1
        hits += is_complete(hole, (*board, *runout), target, target_rank)

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


def prompt_for(target: str, target_rank: str | None = None) -> str:
    if target == "flush":
        return "フラッシュの確率は？"
    if target == "straight":
        return "ストレートの確率は？"
    if target == "flush_or_straight":
        return "フラッシュかストレートの確率は？"
    if target == "rank_on_board":
        return f"{display_rank(str(target_rank))}が出る確率は？"
    if target == "three_of_a_kind":
        return f"{display_rank(str(target_rank))}の3カードの確率は？"
    raise ValueError(f"未対応の完成条件: {target}")


def explanation(stage: str, category: str) -> str:
    if stage == "preflop":
        if category == "rank_trips":
            return "ポケットペアが3カード以上になるのは約5回に1回です。"
        return "スーテッドでもフラッシュになるのは約16回に1回。見た目ほど頻繁ではありません。"

    if category == "flush_draw":
        if stage == "flop":
            return "フロップのフラッシュドローは、ざっくり3回に1回です。"
        return "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
    if category == "oesd":
        if stage == "flop":
            return "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
        return "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
    if category == "gutshot":
        if stage == "flop":
            return "内側だけを待つガットショットは、OESDよりかなり低めです。"
        return "残り1枚のガットショットは、10回に1回弱です。"
    if category == "combo_gutshot":
        if stage == "flop":
            return "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
        return "2方向のドローでも、残り1枚なら約4回に1回です。"
    if category == "combo_oesd":
        if stage == "flop":
            return "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
        return "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
    if category == "rank_hit":
        if stage == "flop":
            return "手札と同じランクは残り3枚。2枚のうちに重なるのは約8回に1回です。"
        return "手札と同じランクは残り3枚。残り1枚で重なるのは約15回に1回です。"
    if category == "rank_trips":
        if stage == "flop":
            return "ポケットペアから3カード以上になるのは、約12回に1回です。"
        return "残り1枚でポケットペアを3カードにできるのは、約23回に1回です。"
    raise ValueError(f"未対応のカテゴリ: {category}")


def build_preflop_questions() -> list[dict[str, object]]:
    suited_hands = (
        ("Ah", "Kh"),
        ("Qs", "Js"),
        ("Td", "9d"),
        ("8c", "7c"),
        ("6h", "5h"),
    )
    hits, total, percent = exact_percent(suited_hands[0], (), "flush")
    if round(percent, 1) != 6.4:
        raise RuntimeError(f"プリフロップ検算に失敗: {hits}/{total} = {percent}")

    questions = [
        {
            "id": f"preflop-flush-{index:02d}",
            "mode": "A",
            "stage": "preflop",
            "hole": list(hole),
            "board": [],
            "target": "flush",
            "trueP": round(percent, 2),
            "answer": "5%",
            "distractor": "15%",
            "category": "flush_draw",
            "prompt": prompt_for("flush"),
            "explain": explanation("preflop", "flush_draw"),
        }
        for index, hole in enumerate(suited_hands, start=1)
    ]

    for index, target_rank in enumerate(FOCUSED_RANKS, start=1):
        hole = (f"{target_rank}h", f"{target_rank}d")
        _, _, trips_percent = exact_percent(
            hole,
            (),
            "three_of_a_kind",
            target_rank,
        )
        questions.append(
            {
                "id": f"preflop-rank-trips-{index:02d}",
                "mode": "A",
                "stage": "preflop",
                "hole": list(hole),
                "board": [],
                "target": "three_of_a_kind",
                "targetRank": target_rank,
                "trueP": round(trips_percent, 2),
                "answer": "20%",
                "distractor": "35%",
                "category": "rank_trips",
                "prompt": prompt_for("three_of_a_kind", target_rank),
                "explain": explanation("preflop", "rank_trips"),
            }
        )

    return questions


def filler_cards(target_rank: str, count: int) -> tuple[str, ...]:
    return tuple(card for card in FILLER_CARDS if card[0] != target_rank)[:count]


def build_focused_rank_questions(stage: str) -> list[dict[str, object]]:
    board_size = 3 if stage == "flop" else 4
    questions: list[dict[str, object]] = []

    for index, target_rank in enumerate(FOCUSED_RANKS, start=1):
        cards = filler_cards(target_rank, 1 + board_size)
        hole = (f"{target_rank}h", cards[0])
        board = tuple(cards[1:])
        _, _, hit_percent = exact_percent(
            hole,
            board,
            "rank_on_board",
            target_rank,
        )
        questions.append(
            {
                "id": f"{stage}-rank-hit-{index:02d}",
                "mode": "A",
                "stage": stage,
                "hole": list(hole),
                "board": list(board),
                "target": "rank_on_board",
                "targetRank": target_rank,
                "trueP": round(hit_percent, 2),
                "answer": "10%" if stage == "flop" else "5%",
                "distractor": "25%" if stage == "flop" else "15%",
                "category": "rank_hit",
                "prompt": prompt_for("rank_on_board", target_rank),
                "explain": explanation(stage, "rank_hit"),
            }
        )

        trips_hole = (f"{target_rank}h", f"{target_rank}d")
        trips_board = filler_cards(target_rank, board_size)
        _, _, trips_percent = exact_percent(
            trips_hole,
            trips_board,
            "three_of_a_kind",
            target_rank,
        )
        questions.append(
            {
                "id": f"{stage}-rank-trips-{index:02d}",
                "mode": "A",
                "stage": stage,
                "hole": list(trips_hole),
                "board": list(trips_board),
                "target": "three_of_a_kind",
                "targetRank": target_rank,
                "trueP": round(trips_percent, 2),
                "answer": "10%" if stage == "flop" else "5%",
                "distractor": "20%" if stage == "flop" else "15%",
                "category": "rank_trips",
                "prompt": prompt_for("three_of_a_kind", target_rank),
                "explain": explanation(stage, "rank_trips"),
            }
        )

    return questions


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
            if len(selected[category]) >= 7:
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
                "prompt": prompt_for(target),
                "explain": explanation(stage, category),
            }
            selected[category].append(question)
            seen_shapes[category].add(shape)

        if all(len(questions) == 7 for questions in selected.values()):
            break
    else:
        missing = {
            category: 7 - len(questions)
            for category, questions in selected.items()
            if len(questions) < 7
        }
        raise RuntimeError(f"{stage} の候補が不足しています: {missing}")

    # 同カテゴリが固まらない順番にして、生成物を目視しやすくする。
    return [
        selected[category][index]
        for index in range(7)
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
        if question["category"] == "rank_hit":
            target_rank = str(question["targetRank"])
            hole = tuple(str(card) for card in question["hole"])
            board = tuple(str(card) for card in question["board"])
            if sum(card[0] == target_rank for card in hole) != 1:
                raise RuntimeError(
                    f"対象ランクを手札に1枚持っていません: {question['id']}"
                )
            if any(card[0] == target_rank for card in board):
                raise RuntimeError(
                    f"対象ランクがすでにボードにあります: {question['id']}"
                )

        true_percent = float(question["trueP"])
        answer_percent = parse_percent(str(question["answer"]))
        distractor_percent = parse_percent(str(question["distractor"]))
        if abs(true_percent - answer_percent) >= abs(true_percent - distractor_percent):
            raise RuntimeError(f"誤答のほうが近い問題です: {question['id']}")
        if answer_percent != nearest_five_percent(true_percent):
            raise RuntimeError(f"正解が5%刻みの最寄り値ではありません: {question['id']}")
        ratio = max(answer_percent, distractor_percent) / min(
            answer_percent, distractor_percent
        )
        if ratio < 1.3:
            raise RuntimeError(f"選択肢が近すぎます: {question['id']}")


def parse_percent(value: str) -> int:
    if not value.endswith("%"):
        raise ValueError(f"パーセント表記ではありません: {value}")
    return int(value[:-1])


def nearest_five_percent(value: float) -> int:
    return int((value + 2.5) // 5 * 5)


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
        *build_focused_rank_questions("flop"),
        *build_postflop_questions("turn", rng),
        *build_focused_rank_questions("turn"),
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
