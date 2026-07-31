/* scripts/generate_question_bank.py から生成。直接編集しないでください。 */
(function attachQuestionBank(root) {
  const questions = [
  {
    "id": "preflop-flush-01",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Ah",
      "Kh"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "5%",
    "distractor": "15%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "スーテッドでもフラッシュになるのは約16回に1回。見た目ほど頻繁ではありません。"
  },
  {
    "id": "preflop-flush-02",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Qs",
      "Js"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "5%",
    "distractor": "15%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "スーテッドでもフラッシュになるのは約16回に1回。見た目ほど頻繁ではありません。"
  },
  {
    "id": "preflop-flush-03",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Td",
      "9d"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "5%",
    "distractor": "15%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "スーテッドでもフラッシュになるのは約16回に1回。見た目ほど頻繁ではありません。"
  },
  {
    "id": "preflop-flush-04",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "8c",
      "7c"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "5%",
    "distractor": "15%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "スーテッドでもフラッシュになるのは約16回に1回。見た目ほど頻繁ではありません。"
  },
  {
    "id": "preflop-flush-05",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "6h",
      "5h"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "5%",
    "distractor": "15%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "スーテッドでもフラッシュになるのは約16回に1回。見た目ほど頻繁ではありません。"
  },
  {
    "id": "preflop-rank-trips-01",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Ah",
      "Ad"
    ],
    "board": [],
    "target": "three_of_a_kind",
    "targetRank": "A",
    "trueP": 19.18,
    "answer": "20%",
    "distractor": "35%",
    "category": "rank_trips",
    "prompt": "Aの3カードの確率は？",
    "explain": "ポケットペアが3カード以上になるのは約5回に1回です。"
  },
  {
    "id": "preflop-rank-trips-02",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Kh",
      "Kd"
    ],
    "board": [],
    "target": "three_of_a_kind",
    "targetRank": "K",
    "trueP": 19.18,
    "answer": "20%",
    "distractor": "35%",
    "category": "rank_trips",
    "prompt": "Kの3カードの確率は？",
    "explain": "ポケットペアが3カード以上になるのは約5回に1回です。"
  },
  {
    "id": "preflop-rank-trips-03",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Qh",
      "Qd"
    ],
    "board": [],
    "target": "three_of_a_kind",
    "targetRank": "Q",
    "trueP": 19.18,
    "answer": "20%",
    "distractor": "35%",
    "category": "rank_trips",
    "prompt": "Qの3カードの確率は？",
    "explain": "ポケットペアが3カード以上になるのは約5回に1回です。"
  },
  {
    "id": "preflop-rank-trips-04",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Jh",
      "Jd"
    ],
    "board": [],
    "target": "three_of_a_kind",
    "targetRank": "J",
    "trueP": 19.18,
    "answer": "20%",
    "distractor": "35%",
    "category": "rank_trips",
    "prompt": "Jの3カードの確率は？",
    "explain": "ポケットペアが3カード以上になるのは約5回に1回です。"
  },
  {
    "id": "preflop-rank-trips-05",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Th",
      "Td"
    ],
    "board": [],
    "target": "three_of_a_kind",
    "targetRank": "T",
    "trueP": 19.18,
    "answer": "20%",
    "distractor": "35%",
    "category": "rank_trips",
    "prompt": "10の3カードの確率は？",
    "explain": "ポケットペアが3カード以上になるのは約5回に1回です。"
  },
  {
    "id": "flop-flush_draw-01",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "As",
      "9c"
    ],
    "board": [
      "Ks",
      "8s",
      "4s"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "35%",
    "distractor": "20%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "フロップのフラッシュドローは、ざっくり3回に1回です。"
  },
  {
    "id": "flop-oesd-01",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "8s",
      "7s"
    ],
    "board": [
      "3c",
      "6h",
      "5c"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "30%",
    "distractor": "15%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
  },
  {
    "id": "flop-gutshot-01",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "9c",
      "7c"
    ],
    "board": [
      "8s",
      "Qh",
      "5s"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "20%",
    "distractor": "35%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "内側だけを待つガットショットは、OESDよりかなり低めです。"
  },
  {
    "id": "flop-combo_gutshot-01",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7d",
      "Qd"
    ],
    "board": [
      "Tc",
      "Jd",
      "8d"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "45%",
    "distractor": "30%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
  },
  {
    "id": "flop-combo_oesd-01",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "2d",
      "3d"
    ],
    "board": [
      "Td",
      "5s",
      "4d"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "55%",
    "distractor": "35%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
  },
  {
    "id": "flop-flush_draw-02",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Ad",
      "4d"
    ],
    "board": [
      "Td",
      "9h",
      "7d"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "35%",
    "distractor": "20%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "フロップのフラッシュドローは、ざっくり3回に1回です。"
  },
  {
    "id": "flop-oesd-02",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Kc",
      "Qh"
    ],
    "board": [
      "2h",
      "Tc",
      "Js"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "30%",
    "distractor": "15%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
  },
  {
    "id": "flop-gutshot-02",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Th",
      "3c"
    ],
    "board": [
      "7s",
      "6s",
      "8c"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "20%",
    "distractor": "35%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "内側だけを待つガットショットは、OESDよりかなり低めです。"
  },
  {
    "id": "flop-combo_gutshot-02",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7d",
      "2d"
    ],
    "board": [
      "5h",
      "9d",
      "8d"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "45%",
    "distractor": "30%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
  },
  {
    "id": "flop-combo_oesd-02",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Tc",
      "Js"
    ],
    "board": [
      "Kc",
      "9c",
      "8c"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "55%",
    "distractor": "35%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
  },
  {
    "id": "flop-flush_draw-03",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Js",
      "2c"
    ],
    "board": [
      "Ac",
      "3c",
      "7c"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "35%",
    "distractor": "20%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "フロップのフラッシュドローは、ざっくり3回に1回です。"
  },
  {
    "id": "flop-oesd-03",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "5s",
      "Kd"
    ],
    "board": [
      "Js",
      "Qd",
      "Td"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "30%",
    "distractor": "15%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
  },
  {
    "id": "flop-gutshot-03",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "9d",
      "8h"
    ],
    "board": [
      "5d",
      "Qs",
      "7s"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "20%",
    "distractor": "35%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "内側だけを待つガットショットは、OESDよりかなり低めです。"
  },
  {
    "id": "flop-combo_gutshot-03",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "8c",
      "6c"
    ],
    "board": [
      "7c",
      "Jc",
      "4d"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "45%",
    "distractor": "30%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
  },
  {
    "id": "flop-combo_oesd-03",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "9s",
      "Th"
    ],
    "board": [
      "6h",
      "Jh",
      "8h"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "55%",
    "distractor": "35%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
  },
  {
    "id": "flop-flush_draw-04",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "9d",
      "Jd"
    ],
    "board": [
      "4d",
      "Kd",
      "2s"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "35%",
    "distractor": "20%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "フロップのフラッシュドローは、ざっくり3回に1回です。"
  },
  {
    "id": "flop-oesd-04",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "8c",
      "7d"
    ],
    "board": [
      "9h",
      "6h",
      "3c"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "30%",
    "distractor": "15%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
  },
  {
    "id": "flop-gutshot-04",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7h",
      "6d"
    ],
    "board": [
      "Ac",
      "3c",
      "5d"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "20%",
    "distractor": "35%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "内側だけを待つガットショットは、OESDよりかなり低めです。"
  },
  {
    "id": "flop-combo_gutshot-04",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7h",
      "Jh"
    ],
    "board": [
      "3d",
      "9h",
      "Th"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "45%",
    "distractor": "30%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
  },
  {
    "id": "flop-combo_oesd-04",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Th",
      "7h"
    ],
    "board": [
      "9d",
      "3h",
      "8h"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "55%",
    "distractor": "35%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
  },
  {
    "id": "flop-flush_draw-05",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Jh",
      "Th"
    ],
    "board": [
      "7h",
      "4h",
      "6c"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "35%",
    "distractor": "20%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "フロップのフラッシュドローは、ざっくり3回に1回です。"
  },
  {
    "id": "flop-oesd-05",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "4s",
      "8c"
    ],
    "board": [
      "6d",
      "Tc",
      "7s"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "30%",
    "distractor": "15%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
  },
  {
    "id": "flop-gutshot-05",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "5d",
      "7s"
    ],
    "board": [
      "4c",
      "9s",
      "3h"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "20%",
    "distractor": "35%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "内側だけを待つガットショットは、OESDよりかなり低めです。"
  },
  {
    "id": "flop-combo_gutshot-05",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "3s",
      "5s"
    ],
    "board": [
      "7s",
      "Jc",
      "4s"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "45%",
    "distractor": "30%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
  },
  {
    "id": "flop-combo_oesd-05",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "4d",
      "5d"
    ],
    "board": [
      "7d",
      "6d",
      "Qs"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "55%",
    "distractor": "35%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
  },
  {
    "id": "flop-flush_draw-06",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7s",
      "2s"
    ],
    "board": [
      "Js",
      "8d",
      "5s"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "35%",
    "distractor": "20%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "フロップのフラッシュドローは、ざっくり3回に1回です。"
  },
  {
    "id": "flop-oesd-06",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "6c",
      "3d"
    ],
    "board": [
      "4h",
      "5c",
      "Qh"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "30%",
    "distractor": "15%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
  },
  {
    "id": "flop-gutshot-06",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "9s",
      "2c"
    ],
    "board": [
      "8h",
      "Qd",
      "Tc"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "20%",
    "distractor": "35%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "内側だけを待つガットショットは、OESDよりかなり低めです。"
  },
  {
    "id": "flop-combo_gutshot-06",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Ks",
      "6c"
    ],
    "board": [
      "7s",
      "8s",
      "4s"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "45%",
    "distractor": "30%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
  },
  {
    "id": "flop-combo_oesd-06",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "3h",
      "4h"
    ],
    "board": [
      "Qh",
      "5c",
      "6h"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "55%",
    "distractor": "35%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
  },
  {
    "id": "flop-flush_draw-07",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "3h",
      "4h"
    ],
    "board": [
      "Jh",
      "Qc",
      "Ah"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "35%",
    "distractor": "20%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "フロップのフラッシュドローは、ざっくり3回に1回です。"
  },
  {
    "id": "flop-oesd-07",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "9h",
      "8s"
    ],
    "board": [
      "4h",
      "7c",
      "Th"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "30%",
    "distractor": "15%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "両端を待てるOESDは、フラッシュドローより少し低い程度です。"
  },
  {
    "id": "flop-gutshot-07",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "5d",
      "8s"
    ],
    "board": [
      "9h",
      "4s",
      "6c"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "20%",
    "distractor": "35%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "内側だけを待つガットショットは、OESDよりかなり低めです。"
  },
  {
    "id": "flop-combo_gutshot-07",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Th",
      "Qh"
    ],
    "board": [
      "8h",
      "3h",
      "Jd"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "45%",
    "distractor": "30%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとガットショットの2方向があり、ほぼ2回に1回です。"
  },
  {
    "id": "flop-combo_oesd-07",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7c",
      "Kc"
    ],
    "board": [
      "9c",
      "8c",
      "6d"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "55%",
    "distractor": "35%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "フラッシュとOESDが重なる強いドローで、半分を少し超えます。"
  },
  {
    "id": "flop-rank-hit-01",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Ah",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d"
    ],
    "target": "rank_on_board",
    "targetRank": "A",
    "trueP": 12.49,
    "answer": "10%",
    "distractor": "25%",
    "category": "rank_hit",
    "prompt": "Aが出る確率は？",
    "explain": "手札と同じランクは残り3枚。2枚のうちに重なるのは約8回に1回です。"
  },
  {
    "id": "flop-rank-trips-01",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Ah",
      "Ad"
    ],
    "board": [
      "2c",
      "7s",
      "Jh"
    ],
    "target": "three_of_a_kind",
    "targetRank": "A",
    "trueP": 8.42,
    "answer": "10%",
    "distractor": "20%",
    "category": "rank_trips",
    "prompt": "Aの3カードの確率は？",
    "explain": "ポケットペアから3カード以上になるのは、約12回に1回です。"
  },
  {
    "id": "flop-rank-hit-02",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Kh",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d"
    ],
    "target": "rank_on_board",
    "targetRank": "K",
    "trueP": 12.49,
    "answer": "10%",
    "distractor": "25%",
    "category": "rank_hit",
    "prompt": "Kが出る確率は？",
    "explain": "手札と同じランクは残り3枚。2枚のうちに重なるのは約8回に1回です。"
  },
  {
    "id": "flop-rank-trips-02",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Kh",
      "Kd"
    ],
    "board": [
      "2c",
      "7s",
      "Jh"
    ],
    "target": "three_of_a_kind",
    "targetRank": "K",
    "trueP": 8.42,
    "answer": "10%",
    "distractor": "20%",
    "category": "rank_trips",
    "prompt": "Kの3カードの確率は？",
    "explain": "ポケットペアから3カード以上になるのは、約12回に1回です。"
  },
  {
    "id": "flop-rank-hit-03",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Qh",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d"
    ],
    "target": "rank_on_board",
    "targetRank": "Q",
    "trueP": 12.49,
    "answer": "10%",
    "distractor": "25%",
    "category": "rank_hit",
    "prompt": "Qが出る確率は？",
    "explain": "手札と同じランクは残り3枚。2枚のうちに重なるのは約8回に1回です。"
  },
  {
    "id": "flop-rank-trips-03",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Qh",
      "Qd"
    ],
    "board": [
      "2c",
      "7s",
      "Jh"
    ],
    "target": "three_of_a_kind",
    "targetRank": "Q",
    "trueP": 8.42,
    "answer": "10%",
    "distractor": "20%",
    "category": "rank_trips",
    "prompt": "Qの3カードの確率は？",
    "explain": "ポケットペアから3カード以上になるのは、約12回に1回です。"
  },
  {
    "id": "flop-rank-hit-04",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Jh",
      "2c"
    ],
    "board": [
      "7s",
      "4d",
      "9c"
    ],
    "target": "rank_on_board",
    "targetRank": "J",
    "trueP": 12.49,
    "answer": "10%",
    "distractor": "25%",
    "category": "rank_hit",
    "prompt": "Jが出る確率は？",
    "explain": "手札と同じランクは残り3枚。2枚のうちに重なるのは約8回に1回です。"
  },
  {
    "id": "flop-rank-trips-04",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Jh",
      "Jd"
    ],
    "board": [
      "2c",
      "7s",
      "4d"
    ],
    "target": "three_of_a_kind",
    "targetRank": "J",
    "trueP": 8.42,
    "answer": "10%",
    "distractor": "20%",
    "category": "rank_trips",
    "prompt": "Jの3カードの確率は？",
    "explain": "ポケットペアから3カード以上になるのは、約12回に1回です。"
  },
  {
    "id": "flop-rank-hit-05",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Th",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d"
    ],
    "target": "rank_on_board",
    "targetRank": "T",
    "trueP": 12.49,
    "answer": "10%",
    "distractor": "25%",
    "category": "rank_hit",
    "prompt": "10が出る確率は？",
    "explain": "手札と同じランクは残り3枚。2枚のうちに重なるのは約8回に1回です。"
  },
  {
    "id": "flop-rank-trips-05",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Th",
      "Td"
    ],
    "board": [
      "2c",
      "7s",
      "Jh"
    ],
    "target": "three_of_a_kind",
    "targetRank": "T",
    "trueP": 8.42,
    "answer": "10%",
    "distractor": "20%",
    "category": "rank_trips",
    "prompt": "10の3カードの確率は？",
    "explain": "ポケットペアから3カード以上になるのは、約12回に1回です。"
  },
  {
    "id": "turn-flush_draw-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Kh",
      "9c"
    ],
    "board": [
      "Jc",
      "5d",
      "8c",
      "Ac"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "20%",
    "distractor": "35%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
  },
  {
    "id": "turn-oesd-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "8s",
      "Td"
    ],
    "board": [
      "7h",
      "3d",
      "6s",
      "5h"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "15%",
    "distractor": "30%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
  },
  {
    "id": "turn-gutshot-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jc",
      "5h"
    ],
    "board": [
      "Ts",
      "3h",
      "Qs",
      "Ad"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "10%",
    "distractor": "20%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚のガットショットは、10回に1回弱です。"
  },
  {
    "id": "turn-combo_gutshot-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7h",
      "Ac"
    ],
    "board": [
      "8h",
      "Jh",
      "2s",
      "Th"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "25%",
    "distractor": "45%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "2方向のドローでも、残り1枚なら約4回に1回です。"
  },
  {
    "id": "turn-combo_oesd-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "5h",
      "3h"
    ],
    "board": [
      "Th",
      "Kh",
      "4d",
      "6c"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "35%",
    "distractor": "20%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
  },
  {
    "id": "turn-flush_draw-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2s",
      "Js"
    ],
    "board": [
      "4h",
      "9s",
      "6s",
      "Kh"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "20%",
    "distractor": "35%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
  },
  {
    "id": "turn-oesd-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "8d",
      "7c"
    ],
    "board": [
      "Kd",
      "9s",
      "3s",
      "Th"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "15%",
    "distractor": "30%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
  },
  {
    "id": "turn-gutshot-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2h",
      "Ks"
    ],
    "board": [
      "3s",
      "4s",
      "Ad",
      "7d"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "10%",
    "distractor": "20%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚のガットショットは、10回に1回弱です。"
  },
  {
    "id": "turn-combo_gutshot-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2h",
      "8h"
    ],
    "board": [
      "9c",
      "Th",
      "6h",
      "5s"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "25%",
    "distractor": "45%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "2方向のドローでも、残り1枚なら約4回に1回です。"
  },
  {
    "id": "turn-combo_oesd-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Td",
      "Ks"
    ],
    "board": [
      "7d",
      "4d",
      "Jd",
      "9h"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "35%",
    "distractor": "20%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
  },
  {
    "id": "turn-flush_draw-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Tc",
      "8c"
    ],
    "board": [
      "5c",
      "2c",
      "7s",
      "Ks"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "20%",
    "distractor": "35%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
  },
  {
    "id": "turn-oesd-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9s",
      "Tc"
    ],
    "board": [
      "Jd",
      "Ac",
      "Kh",
      "8h"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "15%",
    "distractor": "30%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
  },
  {
    "id": "turn-gutshot-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2d",
      "5d"
    ],
    "board": [
      "3s",
      "7c",
      "Ad",
      "9h"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "10%",
    "distractor": "20%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚のガットショットは、10回に1回弱です。"
  },
  {
    "id": "turn-combo_gutshot-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "8c",
      "Kd"
    ],
    "board": [
      "Jh",
      "2c",
      "Qc",
      "Ac"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "25%",
    "distractor": "45%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "2方向のドローでも、残り1枚なら約4回に1回です。"
  },
  {
    "id": "turn-combo_oesd-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "4c",
      "5s"
    ],
    "board": [
      "3c",
      "Tc",
      "Kc",
      "6s"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "35%",
    "distractor": "20%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
  },
  {
    "id": "turn-flush_draw-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7s",
      "3s"
    ],
    "board": [
      "Js",
      "5s",
      "Th",
      "Ah"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "20%",
    "distractor": "35%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
  },
  {
    "id": "turn-oesd-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "4s",
      "2h"
    ],
    "board": [
      "8c",
      "5c",
      "3d",
      "Kd"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "15%",
    "distractor": "30%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
  },
  {
    "id": "turn-gutshot-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2d",
      "6h"
    ],
    "board": [
      "4c",
      "5h",
      "Th",
      "Ad"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "10%",
    "distractor": "20%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚のガットショットは、10回に1回弱です。"
  },
  {
    "id": "turn-combo_gutshot-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jh",
      "Tc"
    ],
    "board": [
      "Kc",
      "3h",
      "9h",
      "5h"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "25%",
    "distractor": "45%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "2方向のドローでも、残り1枚なら約4回に1回です。"
  },
  {
    "id": "turn-combo_oesd-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9c",
      "Ah"
    ],
    "board": [
      "Qc",
      "Td",
      "Jc",
      "2c"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "35%",
    "distractor": "20%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
  },
  {
    "id": "turn-flush_draw-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Ac",
      "Tc"
    ],
    "board": [
      "5d",
      "Qc",
      "8c",
      "4s"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "20%",
    "distractor": "35%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
  },
  {
    "id": "turn-oesd-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "8h",
      "9s"
    ],
    "board": [
      "7c",
      "Ad",
      "5c",
      "Td"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "15%",
    "distractor": "30%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
  },
  {
    "id": "turn-gutshot-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Td",
      "5c"
    ],
    "board": [
      "7s",
      "9d",
      "Qh",
      "Kh"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "10%",
    "distractor": "20%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚のガットショットは、10回に1回弱です。"
  },
  {
    "id": "turn-combo_gutshot-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Kd",
      "4s"
    ],
    "board": [
      "Ts",
      "Qh",
      "3s",
      "9s"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "25%",
    "distractor": "45%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "2方向のドローでも、残り1枚なら約4回に1回です。"
  },
  {
    "id": "turn-combo_oesd-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "8s",
      "7s"
    ],
    "board": [
      "2s",
      "6d",
      "4s",
      "Td"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "35%",
    "distractor": "20%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
  },
  {
    "id": "turn-flush_draw-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9h",
      "Ah"
    ],
    "board": [
      "7c",
      "5h",
      "Jd",
      "Qh"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "20%",
    "distractor": "35%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
  },
  {
    "id": "turn-oesd-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7s",
      "4h"
    ],
    "board": [
      "Ts",
      "6c",
      "8c",
      "Qd"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "15%",
    "distractor": "30%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
  },
  {
    "id": "turn-gutshot-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Th",
      "Kc"
    ],
    "board": [
      "3h",
      "Qs",
      "As",
      "7h"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "10%",
    "distractor": "20%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚のガットショットは、10回に1回弱です。"
  },
  {
    "id": "turn-combo_gutshot-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9h",
      "6h"
    ],
    "board": [
      "2s",
      "4s",
      "3h",
      "Qh"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "25%",
    "distractor": "45%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "2方向のドローでも、残り1枚なら約4回に1回です。"
  },
  {
    "id": "turn-combo_oesd-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "6d",
      "3s"
    ],
    "board": [
      "Js",
      "7s",
      "5c",
      "9s"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "35%",
    "distractor": "20%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
  },
  {
    "id": "turn-flush_draw-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9s",
      "8h"
    ],
    "board": [
      "Kh",
      "Th",
      "2h",
      "5s"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "20%",
    "distractor": "35%",
    "category": "flush_draw",
    "prompt": "フラッシュの確率は？",
    "explain": "残りが1枚だけになると、フラッシュドローは約5回に1回です。"
  },
  {
    "id": "turn-oesd-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jd",
      "Kd"
    ],
    "board": [
      "Qc",
      "7c",
      "Tc",
      "6h"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "15%",
    "distractor": "30%",
    "category": "oesd",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚でも両端を待てるため、ガットショットのほぼ2倍あります。"
  },
  {
    "id": "turn-gutshot-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Qd",
      "5s"
    ],
    "board": [
      "Jh",
      "Ks",
      "As",
      "2d"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "10%",
    "distractor": "20%",
    "category": "gutshot",
    "prompt": "ストレートの確率は？",
    "explain": "残り1枚のガットショットは、10回に1回弱です。"
  },
  {
    "id": "turn-combo_gutshot-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Kd",
      "3c"
    ],
    "board": [
      "Jd",
      "Ad",
      "Qh",
      "7d"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "25%",
    "distractor": "45%",
    "category": "combo_gutshot",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "2方向のドローでも、残り1枚なら約4回に1回です。"
  },
  {
    "id": "turn-combo_oesd-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Qc",
      "Jc"
    ],
    "board": [
      "Ac",
      "3d",
      "9c",
      "Td"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "35%",
    "distractor": "20%",
    "category": "combo_oesd",
    "prompt": "フラッシュかストレートの確率は？",
    "explain": "残り1枚でも、フラッシュとOESDの2方向なら約3回に1回です。"
  },
  {
    "id": "turn-rank-hit-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Ah",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d",
      "9c"
    ],
    "target": "rank_on_board",
    "targetRank": "A",
    "trueP": 6.52,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_hit",
    "prompt": "Aが出る確率は？",
    "explain": "手札と同じランクは残り3枚。残り1枚で重なるのは約15回に1回です。"
  },
  {
    "id": "turn-rank-trips-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Ah",
      "Ad"
    ],
    "board": [
      "2c",
      "7s",
      "Jh",
      "4d"
    ],
    "target": "three_of_a_kind",
    "targetRank": "A",
    "trueP": 4.35,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_trips",
    "prompt": "Aの3カードの確率は？",
    "explain": "残り1枚でポケットペアを3カードにできるのは、約23回に1回です。"
  },
  {
    "id": "turn-rank-hit-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Kh",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d",
      "9c"
    ],
    "target": "rank_on_board",
    "targetRank": "K",
    "trueP": 6.52,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_hit",
    "prompt": "Kが出る確率は？",
    "explain": "手札と同じランクは残り3枚。残り1枚で重なるのは約15回に1回です。"
  },
  {
    "id": "turn-rank-trips-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Kh",
      "Kd"
    ],
    "board": [
      "2c",
      "7s",
      "Jh",
      "4d"
    ],
    "target": "three_of_a_kind",
    "targetRank": "K",
    "trueP": 4.35,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_trips",
    "prompt": "Kの3カードの確率は？",
    "explain": "残り1枚でポケットペアを3カードにできるのは、約23回に1回です。"
  },
  {
    "id": "turn-rank-hit-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Qh",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d",
      "9c"
    ],
    "target": "rank_on_board",
    "targetRank": "Q",
    "trueP": 6.52,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_hit",
    "prompt": "Qが出る確率は？",
    "explain": "手札と同じランクは残り3枚。残り1枚で重なるのは約15回に1回です。"
  },
  {
    "id": "turn-rank-trips-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Qh",
      "Qd"
    ],
    "board": [
      "2c",
      "7s",
      "Jh",
      "4d"
    ],
    "target": "three_of_a_kind",
    "targetRank": "Q",
    "trueP": 4.35,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_trips",
    "prompt": "Qの3カードの確率は？",
    "explain": "残り1枚でポケットペアを3カードにできるのは、約23回に1回です。"
  },
  {
    "id": "turn-rank-hit-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jh",
      "2c"
    ],
    "board": [
      "7s",
      "4d",
      "9c",
      "3h"
    ],
    "target": "rank_on_board",
    "targetRank": "J",
    "trueP": 6.52,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_hit",
    "prompt": "Jが出る確率は？",
    "explain": "手札と同じランクは残り3枚。残り1枚で重なるのは約15回に1回です。"
  },
  {
    "id": "turn-rank-trips-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jh",
      "Jd"
    ],
    "board": [
      "2c",
      "7s",
      "4d",
      "9c"
    ],
    "target": "three_of_a_kind",
    "targetRank": "J",
    "trueP": 4.35,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_trips",
    "prompt": "Jの3カードの確率は？",
    "explain": "残り1枚でポケットペアを3カードにできるのは、約23回に1回です。"
  },
  {
    "id": "turn-rank-hit-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Th",
      "2c"
    ],
    "board": [
      "7s",
      "Jh",
      "4d",
      "9c"
    ],
    "target": "rank_on_board",
    "targetRank": "T",
    "trueP": 6.52,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_hit",
    "prompt": "10が出る確率は？",
    "explain": "手札と同じランクは残り3枚。残り1枚で重なるのは約15回に1回です。"
  },
  {
    "id": "turn-rank-trips-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Th",
      "Td"
    ],
    "board": [
      "2c",
      "7s",
      "Jh",
      "4d"
    ],
    "target": "three_of_a_kind",
    "targetRank": "T",
    "trueP": 4.35,
    "answer": "5%",
    "distractor": "15%",
    "category": "rank_trips",
    "prompt": "10の3カードの確率は？",
    "explain": "残り1枚でポケットペアを3カードにできるのは、約23回に1回です。"
  }
];
  const bank = Object.freeze(questions.map((question) => Object.freeze(question)));

  if (typeof module === "object" && module.exports) {
    module.exports = bank;
  }

  if (root) {
    root.QUESTION_BANK = bank;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
