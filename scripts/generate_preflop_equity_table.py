#!/usr/bin/env python3
"""トップページのスターティングハンド勝率表をMarkdownの正本から生成する。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "questions" / "preflop-equities.md"
OUTPUT = ROOT / "src" / "generated" / "preflop-equity-table.json"
RANKS = "AKQJT98765432"
ROW_PATTERN = re.compile(
    r"^\|\s*([2-9TJQKA]{2}(?:[so])?)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|$",
    re.MULTILINE,
)


def starting_hand_labels() -> list[str]:
    labels = []
    for high_index, high in enumerate(RANKS):
        labels.append(f"{high}{high}")
        for low in RANKS[high_index + 1:]:
            labels.extend((f"{high}{low}s", f"{high}{low}o"))
    return labels


def parse_source() -> list[dict]:
    rows = [
        {"hand": hand, "players6": float(players6), "players9": float(players9)}
        for hand, players6, players9 in ROW_PATTERN.findall(
            SOURCE.read_text(encoding="utf-8")
        )
    ]
    expected = starting_hand_labels()
    actual = [row["hand"] for row in rows]
    if len(actual) != 169 or len(set(actual)) != 169:
        raise ValueError("勝率表は重複なしの169ハンドにしてください")
    if set(actual) != set(expected):
        missing = sorted(set(expected) - set(actual))
        extra = sorted(set(actual) - set(expected))
        raise ValueError(f"勝率表のハンドが不正です: missing={missing}, extra={extra}")
    values = {row["hand"]: row for row in rows}
    return [values[hand] for hand in expected]


def render() -> str:
    return json.dumps(parse_source(), ensure_ascii=False, indent=2) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != expected:
            print(
                "生成済みスターティングハンド勝率表が正本と一致しません: "
                f"{OUTPUT.relative_to(ROOT)}",
                file=sys.stderr,
            )
            return 1
        print(
            "スターティングハンド勝率表: 169ハンド / 6人卓・9人卓 / 正本と一致"
        )
        return 0
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(expected, encoding="utf-8")
    print(f"{OUTPUT.relative_to(ROOT)} を生成しました")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
