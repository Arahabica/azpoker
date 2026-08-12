#!/usr/bin/env python3
"""Markdownの問題パターン正本からPython・TypeScript定義を生成する。"""

from __future__ import annotations

import argparse
import json
import pprint
import re
import subprocess
import sys
import tomllib
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "questions" / "patterns.md"
PYTHON_OUTPUT = ROOT / "scripts" / "generated" / "question_patterns.py"
TYPESCRIPT_OUTPUT = ROOT / "src" / "generated" / "question-patterns.ts"

CATALOG_BLOCK = re.compile(
    r"```toml question-catalog\s*\n(.*?)\n```",
    re.DOTALL,
)
PATTERN_BLOCK = re.compile(
    r"```toml question-pattern\s*\n(.*?)\n```",
    re.DOTALL,
)

GENERATOR_NAMES = {
    "A基本": "a_core",
    "A追加": "a_addition",
    "B比較": "b_core",
    "B数値": "b_addition",
    "Cプリフロップ": "c_core",
    "Cポストフロップ": "c_addition",
    "D指定カード": "d_core",
    "D相手役": "d_addition",
}
LEVEL_NAMES = {
    "初心者": "beginner",
    "中級者": "intermediate",
    "上級者": "advanced",
}
STAGE_NAMES = {
    "プリフロップ": "preflop",
    "フロップ": "flop",
    "ターン": "turn",
}
ANSWER_TYPE_NAMES = {
    "確率": "percent",
    "手札選択": "hand",
}
D_FAMILY_NAMES = {
    "完成役・所持札": "holding",
    "ドロー": "draw",
    "テーブル全体": "table",
    "危険ボード": "board_threat",
}
MODES = ("A", "B", "C", "D")


def fail(message: str) -> None:
    raise ValueError(f"{SOURCE.relative_to(ROOT)}: {message}")


def require_string(pattern: dict, field: str) -> str:
    value = pattern.get(field)
    if not isinstance(value, str) or not value.strip():
        fail(f"{pattern.get('id', 'ID不明')} の {field} がありません")
    return value


def normalize_pattern(raw: dict) -> dict:
    pattern_id = require_string(raw, "id")
    mode = require_string(raw, "mode")
    if mode not in MODES:
        fail(f"{pattern_id} の mode が不正です: {mode}")

    count = raw.get("count")
    if not isinstance(count, int) or count <= 0:
        fail(f"{pattern_id} の count は正の整数にしてください")

    generator_name = require_string(raw, "generator")
    if generator_name not in GENERATOR_NAMES:
        fail(f"{pattern_id} の generator が不正です: {generator_name}")

    answer_name = require_string(raw, "answer_type")
    if answer_name not in ANSWER_TYPE_NAMES:
        fail(f"{pattern_id} の answer_type が不正です: {answer_name}")

    raw_stages = raw.get("stages")
    if not isinstance(raw_stages, list) or not raw_stages:
        fail(f"{pattern_id} の stages がありません")
    try:
        stages = [STAGE_NAMES[stage] for stage in raw_stages]
    except KeyError as error:
        fail(f"{pattern_id} の stages が不正です: {error.args[0]}")

    audience = raw.get("audience")
    audience_by_players = raw.get("audience_by_players")
    audience_rule = raw.get("audience_rule")
    audience_fields = sum(
        value is not None
        for value in (audience, audience_by_players, audience_rule)
    )
    if audience_fields != 1:
        fail(
            f"{pattern_id} は audience、audience_by_players、audience_rule の"
            "いずれか1つを指定してください"
        )

    normalized: dict = {
        "id": pattern_id,
        "mode": mode,
        "name": require_string(raw, "name"),
        "purpose": require_string(raw, "purpose"),
        "example": require_string(raw, "example"),
        "count": count,
        "generator": GENERATOR_NAMES[generator_name],
        "answer_type": ANSWER_TYPE_NAMES[answer_name],
        "stages": stages,
    }

    if audience is not None:
        if audience not in LEVEL_NAMES:
            fail(f"{pattern_id} の audience が不正です: {audience}")
        normalized["level_rule"] = "fixed"
        normalized["level"] = LEVEL_NAMES[audience]
    elif audience_by_players is not None:
        if not isinstance(audience_by_players, dict) or not audience_by_players:
            fail(f"{pattern_id} の audience_by_players が不正です")
        try:
            normalized["levels_by_players"] = {
                int(players.removesuffix("人")): LEVEL_NAMES[level]
                for players, level in audience_by_players.items()
            }
        except (AttributeError, KeyError, ValueError):
            fail(f"{pattern_id} の audience_by_players が不正です")
        normalized["level_rule"] = "players"
    else:
        if audience_rule != "対決類型":
            fail(f"{pattern_id} の audience_rule が不正です: {audience_rule}")
        normalized["level_rule"] = "b_archetype"

    players = raw.get("players")
    if players is not None:
        if (
            not isinstance(players, list)
            or not players
            or any(player not in (2, 6) for player in players)
        ):
            fail(f"{pattern_id} の players が不正です")
        normalized["players"] = players

    family_name = raw.get("session_family")
    if mode == "D":
        if family_name not in D_FAMILY_NAMES:
            fail(f"{pattern_id} の session_family が不正です: {family_name}")
        normalized["session_family"] = D_FAMILY_NAMES[family_name]
    elif family_name is not None:
        fail(f"{pattern_id} では session_family を指定できません")

    if "per_player" in raw:
        per_player = raw["per_player"]
        if not isinstance(per_player, int) or per_player <= 0:
            fail(f"{pattern_id} の per_player が不正です")
        normalized["per_player"] = per_player

    if "stage_counts" in raw:
        stage_counts = raw["stage_counts"]
        if not isinstance(stage_counts, dict):
            fail(f"{pattern_id} の stage_counts が不正です")
        normalized["stage_counts"] = {
            STAGE_NAMES.get(stage, stage): count
            for stage, count in stage_counts.items()
        }
        if (
            any(stage not in stages for stage in normalized["stage_counts"])
            or any(
                not isinstance(value, int) or value <= 0
                for value in normalized["stage_counts"].values()
            )
            or sum(normalized["stage_counts"].values()) != count
        ):
            fail(f"{pattern_id} の stage_counts と count が一致しません")

    if "variants" in raw:
        variants = raw["variants"]
        if not isinstance(variants, dict):
            fail(f"{pattern_id} の variants が不正です")
        normalized_variants = {}
        variant_total = 0
        for stage, entries in variants.items():
            normalized_stage = STAGE_NAMES.get(stage, stage)
            if normalized_stage not in stages or not isinstance(entries, dict):
                fail(f"{pattern_id} の variants/{stage} が不正です")
            normalized_variants[normalized_stage] = {}
            for variant_id, details in entries.items():
                if not isinstance(details, dict):
                    fail(f"{pattern_id} の variant/{variant_id} が不正です")
                variant_count = details.get("count")
                variant_audience = details.get("audience")
                if (
                    not isinstance(variant_count, int)
                    or variant_count <= 0
                    or variant_audience not in LEVEL_NAMES
                ):
                    fail(f"{pattern_id} の variant/{variant_id} が不正です")
                normalized_variants[normalized_stage][variant_id] = {
                    "name": require_string(details, "name"),
                    "count": variant_count,
                    "level": LEVEL_NAMES[variant_audience],
                }
                variant_total += variant_count
        if variant_total != count:
            fail(f"{pattern_id} の variants 合計と count が一致しません")
        normalized["variants"] = normalized_variants

    return normalized


def load_catalog() -> tuple[dict, list[dict]]:
    source = SOURCE.read_text(encoding="utf-8")
    catalog_matches = CATALOG_BLOCK.findall(source)
    if len(catalog_matches) != 1:
        fail("question-catalog ブロックは1つだけ必要です")
    catalog = tomllib.loads(catalog_matches[0])
    raw_patterns = [tomllib.loads(block) for block in PATTERN_BLOCK.findall(source)]
    if not raw_patterns:
        fail("question-pattern ブロックがありません")
    patterns = [normalize_pattern(pattern) for pattern in raw_patterns]

    keys = [(pattern["mode"], pattern["id"]) for pattern in patterns]
    if len(keys) != len(set(keys)):
        duplicates = [key for key, count in Counter(keys).items() if count > 1]
        fail(f"パターンIDが重複しています: {duplicates}")

    expected_mode_counts = catalog.get("expected_mode_counts")
    actual_mode_counts = {
        mode: sum(pattern["count"] for pattern in patterns if pattern["mode"] == mode)
        for mode in MODES
    }
    if expected_mode_counts != actual_mode_counts:
        fail(
            "expected_mode_counts とパターン内訳が一致しません: "
            f"期待={expected_mode_counts}, 実際={actual_mode_counts}"
        )

    batch_size = catalog.get("batch_size")
    if not isinstance(batch_size, int) or batch_size <= 0:
        fail("batch_size は正の整数にしてください")
    group_counts = {
        "A": actual_mode_counts["A"],
        "BC": actual_mode_counts["B"] + actual_mode_counts["C"],
        "D": actual_mode_counts["D"],
    }
    if any(count % batch_size for count in group_counts.values()):
        fail(f"各配信グループの問題数は {batch_size} の倍数にしてください")

    catalog = {
        "schema_version": catalog.get("schema_version"),
        "batch_size": batch_size,
        "mode_counts": actual_mode_counts,
        "group_counts": group_counts,
    }
    if catalog["schema_version"] != 1:
        fail("schema_version は1にしてください")
    return catalog, patterns


def python_source(catalog: dict, patterns: list[dict]) -> str:
    pattern_counts = {
        mode: {
            pattern["id"]: pattern["count"]
            for pattern in patterns
            if pattern["mode"] == mode
        }
        for mode in MODES
    }
    legacy_mode_counts = {
        mode: sum(
            pattern["count"]
            for pattern in patterns
            if pattern["mode"] == mode and pattern["generator"].endswith("core")
        )
        for mode in MODES
    }

    def counts_for(generator: str) -> dict[str, int]:
        return {
            pattern["id"]: pattern["count"]
            for pattern in patterns
            if pattern["generator"] == generator
        }

    hand_comparison = next(
        pattern
        for pattern in patterns
        if pattern["mode"] == "B" and pattern["id"] == "hand_comparison"
    )
    b_stage_targets = {
        stage: {
            variant_id: details["count"]
            for variant_id, details in variants.items()
        }
        for stage, variants in hand_comparison["variants"].items()
    }
    b_beginner_archetypes = sorted(
        variant_id
        for variants in hand_comparison["variants"].values()
        for variant_id, details in variants.items()
        if details["level"] == "beginner"
    )
    opponent_rank = next(
        pattern
        for pattern in patterns
        if pattern["mode"] == "D" and pattern["id"] == "opponent_rank"
    )
    postflop_equity = next(
        pattern
        for pattern in patterns
        if pattern["mode"] == "C" and pattern["id"] == "postflop_equity"
    )

    values = {
        "QUESTION_PATTERNS": tuple(patterns),
        "PATTERN_BY_KEY": {
            f"{pattern['mode']}:{pattern['id']}": pattern for pattern in patterns
        },
        "QUESTION_PATTERN_COUNTS": pattern_counts,
        "MODE_COUNTS": catalog["mode_counts"],
        "LEGACY_MODE_COUNTS": legacy_mode_counts,
        "GROUP_COUNTS": catalog["group_counts"],
        "BATCH_SIZE": catalog["batch_size"],
        "A_COUNTS": counts_for("a_core"),
        "NEW_A_COUNTS": counts_for("a_addition"),
        "NEW_B_COUNTS": counts_for("b_addition"),
        "NEW_D_COUNTS": counts_for("d_addition"),
        "B_HAND_COMPARISON_STAGE_TARGETS": b_stage_targets,
        "B_BEGINNER_ARCHETYPES": tuple(b_beginner_archetypes),
        "C_POSTFLOP_PER_PLAYER": postflop_equity["per_player"],
        "D_OPPONENT_RANK_STAGE_COUNTS": opponent_rank["stage_counts"],
        "D_CATEGORY_FAMILIES": {
            pattern["id"]: pattern["session_family"]
            for pattern in patterns
            if pattern["mode"] == "D"
        },
    }
    body = "\n\n".join(
        f"{name} = {pprint.pformat(value, width=100, sort_dicts=False)}"
        for name, value in values.items()
    )
    return (
        "# このファイルは questions/patterns.md から自動生成されます。\n"
        "# 直接編集せず、pnpm patterns:build を実行してください。\n\n"
        f"{body}\n"
    )


def typescript_source(catalog: dict, patterns: list[dict]) -> str:
    pattern_counts = {
        mode: {
            pattern["id"]: pattern["count"]
            for pattern in patterns
            if pattern["mode"] == mode
        }
        for mode in MODES
    }
    answer_type_counts = {
        mode: dict(
            Counter(
                pattern["answer_type"]
                for pattern in patterns
                if pattern["mode"] == mode
                for _ in range(pattern["count"])
            )
        )
        for mode in MODES
    }
    hand_comparison = next(
        pattern
        for pattern in patterns
        if pattern["mode"] == "B" and pattern["id"] == "hand_comparison"
    )
    archetype_counts: Counter[str] = Counter()
    for variants in hand_comparison["variants"].values():
        archetype_counts.update(
            {
                variant_id: details["count"]
                for variant_id, details in variants.items()
            }
        )
    d_families = {
        pattern["id"]: pattern["session_family"]
        for pattern in patterns
        if pattern["mode"] == "D"
    }
    d_family_type = " | ".join(
        json.dumps(family) for family in sorted(set(D_FAMILY_NAMES.values()))
    )

    def js(value: object) -> str:
        return json.dumps(value, ensure_ascii=False, indent=2)

    source = f'''// このファイルは questions/patterns.md から自動生成されます。
// 直接編集せず、pnpm patterns:build を実行してください。

import type {{ GameMode }} from "../types.ts";

const QUESTION_BATCH_SIZE = {catalog["batch_size"]} as const;
const QUESTION_TOTAL = {sum(catalog["mode_counts"].values())} as const;
const QUESTION_MODE_COUNTS = {js(catalog["mode_counts"])} as const satisfies Readonly<Record<GameMode, number>>;
const QUESTION_GROUP_COUNTS = {js(catalog["group_counts"])} as const;
const QUESTION_PATTERN_COUNTS = {js(pattern_counts)} as const satisfies Readonly<Record<GameMode, Readonly<Record<string, number>>>>;
const QUESTION_ANSWER_TYPE_COUNTS = {js(answer_type_counts)} as const;
const B_HAND_COMPARISON_ARCHETYPE_COUNTS = {js(dict(archetype_counts))} as const;

type DQuestionFamily = {d_family_type};

const D_CATEGORY_FAMILIES: Readonly<Record<string, DQuestionFamily>> = Object.freeze({js(d_families)});

function dQuestionFamily(category: string): DQuestionFamily {{
  const family = D_CATEGORY_FAMILIES[category];
  if (!family) throw new Error(`未登録のモードDカテゴリです: ${{category}}`);
  return family;
}}

export {{
  B_HAND_COMPARISON_ARCHETYPE_COUNTS,
  D_CATEGORY_FAMILIES,
  QUESTION_ANSWER_TYPE_COUNTS,
  QUESTION_BATCH_SIZE,
  QUESTION_GROUP_COUNTS,
  QUESTION_MODE_COUNTS,
  QUESTION_PATTERN_COUNTS,
  QUESTION_TOTAL,
  dQuestionFamily,
}};
export type {{ DQuestionFamily }};
'''
    prettier = ROOT / "node_modules" / ".bin" / "prettier"
    if not prettier.exists():
        fail("TypeScript生成物の整形に必要なPrettierがありません。pnpm installを実行してください")
    result = subprocess.run(
        [str(prettier), "--parser", "typescript"],
        input=source,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        fail(f"TypeScript生成物を整形できませんでした: {result.stderr.strip()}")
    return result.stdout


def expected_outputs() -> dict[Path, str]:
    catalog, patterns = load_catalog()
    return {
        PYTHON_OUTPUT: python_source(catalog, patterns),
        TYPESCRIPT_OUTPUT: typescript_source(catalog, patterns),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = expected_outputs()

    if args.check:
        stale = [
            path.relative_to(ROOT)
            for path, expected in outputs.items()
            if not path.exists() or path.read_text(encoding="utf-8") != expected
        ]
        if stale:
            print(
                "生成済みパターン定義が正本と一致しません: "
                + ", ".join(map(str, stale)),
                file=sys.stderr,
            )
            print("pnpm patterns:build を実行してください", file=sys.stderr)
            return 1
        catalog, patterns = load_catalog()
        totals = ", ".join(
            f"{mode} {catalog['mode_counts'][mode]:,}問" for mode in MODES
        )
        print(f"問題パターン: {len(patterns)}種類 / {totals}")
        return 0

    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"生成: {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
