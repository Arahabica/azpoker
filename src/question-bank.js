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
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
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
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
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
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
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
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
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
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
  },
  {
    "id": "preflop-flush-06",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "As",
      "5s"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
  },
  {
    "id": "preflop-flush-07",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Kc",
      "Qc"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
  },
  {
    "id": "preflop-flush-08",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "Jh",
      "Th"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
  },
  {
    "id": "preflop-flush-09",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "9s",
      "8s"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
  },
  {
    "id": "preflop-flush-10",
    "mode": "A",
    "stage": "preflop",
    "hole": [
      "7d",
      "6d"
    ],
    "board": [],
    "target": "flush",
    "trueP": 6.4,
    "answer": "1/20",
    "distractor": "1/10",
    "category": "flush_draw",
    "explain": "同じスートは残り11枚。未知のボード5枚から3枚以上来る全組合せを数えると約6.4%です。ランクが違ってもフラッシュ確率は同じです。"
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
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
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
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
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
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
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
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
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
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
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
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
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
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
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
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
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
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
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
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
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
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
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
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
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
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
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
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
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
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
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
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
  },
  {
    "id": "flop-flush_draw-08",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "5c",
      "Qc"
    ],
    "board": [
      "Ad",
      "7c",
      "Kc"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
  },
  {
    "id": "flop-oesd-08",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Tc",
      "3s"
    ],
    "board": [
      "8d",
      "7c",
      "9h"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
  },
  {
    "id": "flop-gutshot-08",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "8d",
      "9s"
    ],
    "board": [
      "7d",
      "Ad",
      "Jh"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
  },
  {
    "id": "flop-combo_gutshot-08",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7h",
      "5h"
    ],
    "board": [
      "Kd",
      "4h",
      "3h"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
  },
  {
    "id": "flop-combo_oesd-08",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "8h",
      "5h"
    ],
    "board": [
      "9h",
      "Jh",
      "7d"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
  },
  {
    "id": "flop-flush_draw-09",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "4c",
      "5c"
    ],
    "board": [
      "Qd",
      "Kc",
      "7c"
    ],
    "target": "flush",
    "trueP": 34.97,
    "answer": "1/3",
    "distractor": "1/4",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。ターンとリバーの全組合せを重複なく数えると約35.0%です。"
  },
  {
    "id": "flop-oesd-09",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "9c",
      "8s"
    ],
    "board": [
      "Kh",
      "6h",
      "7d"
    ],
    "target": "straight",
    "trueP": 31.45,
    "answer": "1/3",
    "distractor": "1/5",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。ターンとリバーまでを全列挙すると約31.5%です。"
  },
  {
    "id": "flop-gutshot-09",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "7c",
      "Td"
    ],
    "board": [
      "9h",
      "6d",
      "Kd"
    ],
    "target": "straight",
    "trueP": 17.95,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。フロップではランナーランナーの完成も含めます。全列挙では約17.9%です。"
  },
  {
    "id": "flop-combo_gutshot-09",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "8h",
      "Th"
    ],
    "board": [
      "6h",
      "As",
      "7h"
    ],
    "target": "flush_or_straight",
    "trueP": 45.79,
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
  },
  {
    "id": "flop-combo_oesd-09",
    "mode": "A",
    "stage": "flop",
    "hole": [
      "Kh",
      "Qc"
    ],
    "board": [
      "5c",
      "Tc",
      "Jc"
    ],
    "target": "flush_or_straight",
    "trueP": 54.12,
    "answer": "1/2",
    "distractor": "1/3",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、ターンとリバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "6s",
      "7s"
    ],
    "board": [
      "Qs",
      "4c",
      "2s",
      "Kc"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7s",
      "3s"
    ],
    "board": [
      "8h",
      "Td",
      "5s",
      "9h"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9d",
      "2c"
    ],
    "board": [
      "Jd",
      "7c",
      "Th",
      "As"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jh",
      "9d"
    ],
    "board": [
      "Ad",
      "Kd",
      "3s",
      "Qd"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-01",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "5s",
      "8h"
    ],
    "board": [
      "3h",
      "4s",
      "As",
      "6s"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7h",
      "Qd"
    ],
    "board": [
      "Kh",
      "2h",
      "8h",
      "4s"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "8s",
      "5d"
    ],
    "board": [
      "4s",
      "3c",
      "7h",
      "2c"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7h",
      "Ah"
    ],
    "board": [
      "9c",
      "Qc",
      "8d",
      "5c"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jd",
      "Td"
    ],
    "board": [
      "8d",
      "Ah",
      "Kd",
      "6h"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-02",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "8h",
      "9c"
    ],
    "board": [
      "Ts",
      "3c",
      "5c",
      "Jc"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Tc",
      "8d"
    ],
    "board": [
      "4d",
      "Ah",
      "7d",
      "2d"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7h",
      "Kd"
    ],
    "board": [
      "9s",
      "Tc",
      "3h",
      "8c"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Ad",
      "9s"
    ],
    "board": [
      "7d",
      "5c",
      "2c",
      "3s"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Qs",
      "3d"
    ],
    "board": [
      "8d",
      "7c",
      "4d",
      "6d"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-03",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "6h",
      "7s"
    ],
    "board": [
      "Th",
      "4h",
      "5h",
      "2c"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "6h",
      "7s"
    ],
    "board": [
      "As",
      "Qc",
      "Ks",
      "3s"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2c",
      "5d"
    ],
    "board": [
      "3c",
      "8d",
      "4d",
      "7h"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2s",
      "Js"
    ],
    "board": [
      "4c",
      "3d",
      "Qc",
      "Ad"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "4h",
      "3c"
    ],
    "board": [
      "7h",
      "9c",
      "Qc",
      "5c"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-04",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jc",
      "Tc"
    ],
    "board": [
      "As",
      "4s",
      "Qc",
      "9c"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7d",
      "Jd"
    ],
    "board": [
      "As",
      "4s",
      "5d",
      "2d"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "6d",
      "5d"
    ],
    "board": [
      "Ts",
      "7h",
      "Jc",
      "8d"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Th",
      "Ks"
    ],
    "board": [
      "9h",
      "As",
      "7c",
      "6d"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9h",
      "4h"
    ],
    "board": [
      "Ac",
      "3h",
      "6h",
      "7c"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-05",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jd",
      "6d"
    ],
    "board": [
      "Ts",
      "9c",
      "Qd",
      "2d"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9c",
      "6h"
    ],
    "board": [
      "5h",
      "Kh",
      "Qs",
      "2h"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9h",
      "7d"
    ],
    "board": [
      "8d",
      "6d",
      "Qs",
      "4h"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Kh",
      "3d"
    ],
    "board": [
      "5c",
      "7h",
      "Js",
      "4s"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "3d",
      "Jd"
    ],
    "board": [
      "4d",
      "Tc",
      "6d",
      "7s"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-06",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "7h",
      "Ts"
    ],
    "board": [
      "9s",
      "8h",
      "4h",
      "Kh"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Ac",
      "6c"
    ],
    "board": [
      "2c",
      "Jd",
      "Qc",
      "9d"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "3s",
      "9c"
    ],
    "board": [
      "4h",
      "7s",
      "Ts",
      "6h"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "4h",
      "6h"
    ],
    "board": [
      "9d",
      "Ts",
      "7c",
      "Jh"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "As",
      "8c"
    ],
    "board": [
      "Jh",
      "4s",
      "Ks",
      "Ts"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-07",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "5c",
      "9c"
    ],
    "board": [
      "Jc",
      "Ts",
      "7c",
      "Ks"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-08",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "9h",
      "As"
    ],
    "board": [
      "3s",
      "Kc",
      "5s",
      "8s"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-08",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Ks",
      "2d"
    ],
    "board": [
      "Td",
      "4c",
      "Qd",
      "Jc"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-08",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "As",
      "Qh"
    ],
    "board": [
      "Td",
      "8s",
      "2h",
      "9d"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-08",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Jh",
      "5h"
    ],
    "board": [
      "8h",
      "6h",
      "3c",
      "9s"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-08",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "5h",
      "Kh"
    ],
    "board": [
      "3s",
      "4h",
      "2c",
      "Th"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-flush_draw-09",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "6h",
      "2h"
    ],
    "board": [
      "Jh",
      "Qd",
      "8h",
      "Ks"
    ],
    "target": "flush",
    "trueP": 19.57,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "flush_draw",
    "explain": "同じスートの完成カードは9枚。リバーの全組合せを重複なく数えると約19.6%です。"
  },
  {
    "id": "turn-oesd-09",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "3c",
      "6h"
    ],
    "board": [
      "7d",
      "4d",
      "Tc",
      "9d"
    ],
    "target": "straight",
    "trueP": 17.39,
    "answer": "1/6",
    "distractor": "1/3",
    "category": "oesd",
    "explain": "両端の2ランク、合計8枚が主な完成カードです。リバーまでを全列挙すると約17.4%です。"
  },
  {
    "id": "turn-gutshot-09",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "6d",
      "4d"
    ],
    "board": [
      "Jc",
      "8s",
      "Qs",
      "5d"
    ],
    "target": "straight",
    "trueP": 8.7,
    "answer": "1/12",
    "distractor": "1/6",
    "category": "gutshot",
    "explain": "内側の1ランク、合計4枚が主な完成カードです。全列挙では約8.7%です。"
  },
  {
    "id": "turn-combo_gutshot-09",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "Tc",
      "Ad"
    ],
    "board": [
      "7d",
      "9d",
      "Kd",
      "6c"
    ],
    "target": "flush_or_straight",
    "trueP": 26.09,
    "answer": "1/4",
    "distractor": "1/2",
    "category": "combo_gutshot",
    "explain": "フラッシュドローとガットショットを合わせると、次の1枚で完成するカードは重複を除いて12枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
  },
  {
    "id": "turn-combo_oesd-09",
    "mode": "A",
    "stage": "turn",
    "hole": [
      "2h",
      "5s"
    ],
    "board": [
      "4h",
      "6s",
      "7h",
      "Jh"
    ],
    "target": "flush_or_straight",
    "trueP": 32.61,
    "answer": "1/3",
    "distractor": "1/6",
    "category": "combo_oesd",
    "explain": "フラッシュドローとOESDを合わせると、次の1枚で完成するカードは重複を除いて15枚。フラッシュとストレートを別々に足さず、リバーの全組合せを数えます。"
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
