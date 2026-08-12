# 問題パターン一覧

この文書が、暗算ポーカーで「どんな問題を何問用意するか」の正本です。

- 日本語の名称、学習目的、出題例、問題数、対象者、ステージ、出題系統を管理します。
- 各項目の `toml question-pattern` ブロックを機械が読み、PythonとTypeScriptの定義を生成します。
- 確率計算やカード生成のアルゴリズムは、テスト可能なPython関数として実装します。
- 変更後は `pnpm patterns:build`、問題本体も更新する場合は続けて `pnpm questions:build` を実行します。
- `id` は保存済み履歴との互換性に関わるため、意味を変えずに再利用しません。

## 全体構成

```toml question-catalog
schema_version = 1
batch_size = 100
expected_mode_counts = { A = 10000, B = 4800, C = 1200, D = 5000 }
```

## モードA：自分の手札が完成・変化する確率

### フラッシュ

```toml question-pattern
id = "flush"
mode = "A"
name = "フラッシュ"
purpose = "自分の手札がリバーまでにフラッシュになる確率を概算する"
example = "リバーまでにフラッシュになる確率は？"
count = 1400
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ストレート

```toml question-pattern
id = "straight"
mode = "A"
name = "ストレート"
purpose = "OESDやガットショットからストレートになる確率を概算する"
example = "リバーまでにストレートになる確率は？"
count = 1600
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### フラッシュまたはストレート

```toml question-pattern
id = "flush_or_straight"
mode = "A"
name = "フラッシュまたはストレート"
purpose = "複合ドローの重複するアウツを二重に数えず概算する"
example = "フラッシュかストレートになる確率は？"
count = 800
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

### 指定カードが出る

```toml question-pattern
id = "rank_hit"
mode = "A"
name = "指定カードが出る"
purpose = "見えていない同じ数字・文字の枚数からヒット確率を考える"
example = "Aが出る確率は？"
count = 550
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### 指定カードでスリーになる

```toml question-pattern
id = "rank_trips"
mode = "A"
name = "指定カードでスリーになる"
purpose = "ポケットペアがスリーになる確率を考える"
example = "Qがスリーになる確率は？"
count = 500
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ツーペア

```toml question-pattern
id = "two_pair"
mode = "A"
name = "ツーペア"
purpose = "自分の手札がツーペアになる組合せを数える"
example = "ツーペアになる確率は？"
count = 400
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### フルハウス

```toml question-pattern
id = "full_house"
mode = "A"
name = "フルハウス"
purpose = "スリーとペアが同時にそろう組合せを数える"
example = "フルハウスになる確率は？"
count = 400
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

### フォーカード

```toml question-pattern
id = "four_kind"
mode = "A"
name = "フォーカード"
purpose = "同じ数字・文字が4枚そろう確率を考える"
example = "フォーカードになる確率は？"
count = 250
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ストレートフラッシュ

```toml question-pattern
id = "straight_flush"
mode = "A"
name = "ストレートフラッシュ"
purpose = "同じマークかつ連番になる少ないアウツを数える"
example = "ストレートフラッシュになる確率は？"
count = 100
generator = "A基本"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

### バックドアフラッシュ

```toml question-pattern
id = "backdoor_flush"
mode = "A"
name = "バックドアフラッシュ"
purpose = "残り2枚が両方同じマークになる約4.2%を覚える"
example = "リバーまでにフラッシュができる確率は？"
count = 200
generator = "A追加"
answer_type = "確率"
stages = ["フロップ"]
audience = "初心者"
```

### フラッシュドロー

```toml question-pattern
id = "flush_draw"
mode = "A"
name = "フラッシュドロー"
purpose = "同じマークが4枚あるときの完成確率を考える"
example = "フラッシュになる確率は？"
count = 500
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ストレートの両端待ち

```toml question-pattern
id = "oesd"
mode = "A"
name = "ストレートの両端待ち"
purpose = "並びの両端8アウツから完成確率を考える"
example = "ストレートになる確率は？"
count = 500
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ストレートの内側待ち

```toml question-pattern
id = "gutshot"
mode = "A"
name = "ストレートの内側待ち"
purpose = "並びの内側4アウツから完成確率を考える"
example = "ストレートになる確率は？"
count = 500
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ボードにペアができる

```toml question-pattern
id = "board_pair"
mode = "A"
name = "ボードにペアができる"
purpose = "ボードがペアになることで役の状況が変わる確率を考える"
example = "ボードにペアができる確率は？"
count = 350
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ボードがツーペアになる

```toml question-pattern
id = "board_two_pair"
mode = "A"
name = "ボードがツーペアになる"
purpose = "ボード上で異なる2組のペアができる確率を考える"
example = "ボードがツーペアになる確率は？"
count = 300
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

### ポケットペアより高いカードが出る

```toml question-pattern
id = "overcard"
mode = "A"
name = "ポケットペアより高いカードが出る"
purpose = "自分のペアより高いカードがボードへ出る危険を概算する"
example = "残り2枚のどちらかが10以上の確率は？"
count = 400
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "初心者"
```

### ボードに同じマークが4枚になる

```toml question-pattern
id = "four_flush_board"
mode = "A"
name = "ボードに同じマークが4枚になる"
purpose = "次のカードでボードが4フラッシュになる危険を考える"
example = "ボードにハートが4枚になる確率は？"
count = 350
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

### ポケットペアが使われなくなる

```toml question-pattern
id = "pocket_pair_counterfeit"
mode = "A"
name = "ポケットペアが使われなくなる"
purpose = "ボードの役が強くなり自分のポケットペアがベスト5枚から外れる危険を考える"
example = "手札のペアが使われなくなる確率は？"
count = 350
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

### ツーペアの低いペアが使われなくなる

```toml question-pattern
id = "two_pair_counterfeit"
mode = "A"
name = "ツーペアの低いペアが使われなくなる"
purpose = "ボード変化によるツーペアのカウンターフィットを考える"
example = "低いペアが使われなくなる確率は？"
count = 300
generator = "A追加"
answer_type = "確率"
stages = ["フロップ"]
audience = "中級者"
```

### 今の役のまま終わる

```toml question-pattern
id = "same_hand_category"
mode = "A"
name = "今の役のまま終わる"
purpose = "リバーまで役の種類が変わらない確率を考える"
example = "今の役のまま終わる確率は？"
count = 250
generator = "A追加"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

## モードB：2つの手札を比較する

### 勝率が高い手札を選ぶ

類型ごとの件数もこのブロックで管理します。

```toml question-pattern
id = "hand_comparison"
mode = "B"
name = "勝率が高い手札を選ぶ"
purpose = "両方に続行理由がある実戦的な2ハンドを比較する"
example = "勝率が高いのは？"
count = 3000
generator = "B比較"
answer_type = "手札選択"
stages = ["プリフロップ", "フロップ", "ターン"]
audience_rule = "対決類型"

[variants."プリフロップ".pair_vs_overcards]
name = "ポケットペア対オーバーカード"
count = 250
audience = "初心者"

[variants."プリフロップ".pair_vs_high_cards]
name = "ポケットペア対高いカード"
count = 100
audience = "中級者"

[variants."プリフロップ".pair_vs_pair]
name = "ポケットペア同士"
count = 100
audience = "初心者"

[variants."プリフロップ".domination]
name = "同じ高いカードによるドミネーション"
count = 150
audience = "中級者"

[variants."プリフロップ".playable_preflop]
name = "プレイ可能な初期手札同士"
count = 100
audience = "中級者"

[variants."フロップ".draw_vs_two_pair_plus]
name = "ドロー対ツーペア以上"
count = 200
audience = "中級者"

[variants."フロップ".top_pair_vs_flush_draw]
name = "トップペア対フラッシュドロー"
count = 250
audience = "初心者"

[variants."フロップ".one_pair_kicker]
name = "ワンペアのキッカー勝負"
count = 150
audience = "初心者"

[variants."フロップ".combo_hand]
name = "複数の役やドローを持つ手札"
count = 200
audience = "中級者"

[variants."フロップ".continue_matchup]
name = "双方に続行理由がある対決"
count = 350
audience = "中級者"

[variants."ターン".draw_vs_two_pair_plus]
name = "ドロー対ツーペア以上"
count = 200
audience = "中級者"

[variants."ターン".top_pair_vs_flush_draw]
name = "トップペア対フラッシュドロー"
count = 250
audience = "初心者"

[variants."ターン".one_pair_kicker]
name = "ワンペアのキッカー勝負"
count = 150
audience = "初心者"

[variants."ターン".combo_hand]
name = "複数の役やドローを持つ手札"
count = 200
audience = "中級者"

[variants."ターン".continue_matchup]
name = "双方に続行理由がある対決"
count = 350
audience = "中級者"
```

### 現在負けている右手札の勝率

```toml question-pattern
id = "trailing_hand_wins"
mode = "B"
name = "現在負けている右手札の勝率"
purpose = "現在弱い右手札がリバーまでに逆転して勝つ確率を考える"
example = "右の手札の勝率は？"
count = 900
generator = "B数値"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

### 現在勝っている右手札の勝率

```toml question-pattern
id = "leading_hand_holds"
mode = "B"
name = "現在勝っている右手札の勝率"
purpose = "現在強い右手札がリバーまで勝ち続ける確率を考える"
example = "右の手札の勝率は？"
count = 900
generator = "B数値"
answer_type = "確率"
stages = ["フロップ", "ターン"]
audience = "中級者"
```

## モードC：自分の勝率

### プリフロップ勝率

```toml question-pattern
id = "preflop_equity"
mode = "C"
name = "プリフロップ勝率"
purpose = "169種類の初期手札について2人卓と6人卓の基準勝率を覚える"
example = "6人での勝率は？"
count = 338
per_player = 169
generator = "Cプリフロップ"
answer_type = "確率"
stages = ["プリフロップ"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
```

### ポストフロップ勝率

```toml question-pattern
id = "postflop_equity"
mode = "C"
name = "ポストフロップ勝率"
purpose = "現在の手札とボードから2人卓・6人卓でのショーダウン勝率を考える"
example = "6人での勝率は？"
count = 862
per_player = 431
generator = "Cポストフロップ"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "中級者", "6人" = "上級者" }
```

## モードD：相手が持っている可能性

モードDの `session_family` は、同じ10問内で似た問題が重ならないための分類です。

### 相手が指定カードを持つ

```toml question-pattern
id = "opponent_rank"
mode = "D"
name = "相手が指定カードを持つ"
purpose = "見えていない同じ数字・文字が相手へ配られる確率を考える"
example = "6人卓でほかの誰かがAを持つ確率は？"
count = 662
generator = "D指定カード"
answer_type = "確率"
stages = ["プリフロップ", "フロップ", "ターン"]
stage_counts = { "プリフロップ" = 156, "フロップ" = 253, "ターン" = 253 }
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手がポケットペア

```toml question-pattern
id = "opponent_pocket_pair"
mode = "D"
name = "相手がポケットペア"
purpose = "相手の手札2枚が同じ数字・文字になる確率を考える"
example = "6人卓でほかの誰かの手札がペアの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["プリフロップ"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手がオーバーペア

```toml question-pattern
id = "opponent_overpair"
mode = "D"
name = "相手がオーバーペア"
purpose = "ボードの一番高いカードより高いポケットペアの可能性を考える"
example = "6人卓でほかの誰かがボードより高いペアの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手がセット

```toml question-pattern
id = "opponent_set"
mode = "D"
name = "相手がセット"
purpose = "相手のポケットペアとボード1枚でスリーになる可能性を考える"
example = "6人卓でほかの誰かが手札のペアでスリーの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手がトップカードを持つ

```toml question-pattern
id = "opponent_top_pair_plus"
mode = "D"
name = "相手がトップカードを持つ"
purpose = "ボードで一番高いカードと同じカードを相手が持つ可能性を考える"
example = "6人卓でほかの誰かがAを持つ確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手がツーペア

```toml question-pattern
id = "opponent_two_pair"
mode = "D"
name = "相手がツーペア"
purpose = "相手の手札を使って異なる2組のペアができる可能性を考える"
example = "6人卓でほかの誰かがツーペアの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手がストレート

```toml question-pattern
id = "opponent_straight"
mode = "D"
name = "相手がストレート"
purpose = "相手の手札を最低1枚使って完成するストレートの可能性を考える"
example = "6人卓でほかの誰かがストレートの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手がフラッシュ

```toml question-pattern
id = "opponent_flush"
mode = "D"
name = "相手がフラッシュ"
purpose = "相手の手札を最低1枚使って完成するフラッシュの可能性を考える"
example = "6人卓でほかの誰かがフラッシュの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 3枚連続ボードで相手がストレート

ここからの「危険ボード」4パターンには、次の前提を共通で適用します。

- 6人卓は自分1人と相手5人です。
- 表示された自分の手札は、相手へ配られない既知カードとして計算します。
- 答えは、現在のボードで相手5人のうち少なくとも1人が完成役を持つ確率です。
- 参加レンジやフォールド済みカードは推定せず、残りカードを無作為に配る純粋なカード確率です。
- 低い連番から高い連番まで出題し、並びが端に近いことで完成形の数が変わる違いも扱います。

```toml question-pattern
id = "opponent_straight_three_connected_board"
mode = "D"
name = "3枚連続ボードで相手がストレート"
purpose = "3枚の連番が見えているフロップで、6人卓のほかの5人の誰かが不足する2種類を持つ可能性を考える"
example = "ボードが10・J・Qのとき、6人卓でほかの誰かがストレートの確率は？"
count = 250
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ"]
players = [6]
audience = "中級者"
session_family = "危険ボード"
```

### 4枚連続ボードで相手がストレート

```toml question-pattern
id = "opponent_straight_four_connected_board"
mode = "D"
name = "4枚連続ボードで相手がストレート"
purpose = "4枚の連番が見えているターンで、6人卓のほかの5人の誰かが並びの端を持つ可能性を考える"
example = "ボードが10・J・Q・Kのとき、6人卓でほかの誰かがストレートの確率は？"
count = 250
generator = "D相手役"
answer_type = "確率"
stages = ["ターン"]
players = [6]
audience = "中級者"
session_family = "危険ボード"
```

### 同じマーク3枚のボードで相手がフラッシュ

```toml question-pattern
id = "opponent_flush_three_suited_board"
mode = "D"
name = "同じマーク3枚のボードで相手がフラッシュ"
purpose = "同じマーク3枚が見えているフロップで、6人卓のほかの5人の誰かが同じマークを2枚持つ可能性を考える"
example = "ボードにハートが3枚あるとき、6人卓でほかの誰かがフラッシュの確率は？"
count = 250
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ"]
players = [6]
audience = "中級者"
session_family = "危険ボード"
```

### 同じマーク4枚のボードで相手がフラッシュ

```toml question-pattern
id = "opponent_flush_four_suited_board"
mode = "D"
name = "同じマーク4枚のボードで相手がフラッシュ"
purpose = "同じマーク4枚が見えているターンで、6人卓のほかの5人の誰かが同じマークを1枚以上持つ可能性を考える"
example = "ボードにハートが4枚あるとき、6人卓でほかの誰かがフラッシュの確率は？"
count = 250
generator = "D相手役"
answer_type = "確率"
stages = ["ターン"]
players = [6]
audience = "中級者"
session_family = "危険ボード"
```

### 相手がストレートの両端待ち

```toml question-pattern
id = "opponent_oesd"
mode = "D"
name = "相手がストレートの両端待ち"
purpose = "相手がOESDを持つ可能性を考える"
example = "6人卓でほかの誰かがストレートの両端待ちの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "ドロー"
```

### 相手がストレートの内側待ち

```toml question-pattern
id = "opponent_gutshot"
mode = "D"
name = "相手がストレートの内側待ち"
purpose = "相手がガットショットを持つ可能性を考える"
example = "6人卓でほかの誰かがストレートの内側待ちの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "ドロー"
```

### 相手がフラッシュドロー

```toml question-pattern
id = "opponent_flush_draw"
mode = "D"
name = "相手がフラッシュドロー"
purpose = "相手があと1枚でフラッシュになる形を持つ可能性を考える"
example = "6人卓でほかの誰かがあと1枚でフラッシュの確率は？"
count = 209
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "初心者", "6人" = "上級者" }
session_family = "ドロー"
```

### 相手がストレートとフラッシュ待ち

```toml question-pattern
id = "opponent_combo_draw"
mode = "D"
name = "相手がストレートとフラッシュ待ち"
purpose = "相手が複合ドローを持つ可能性を考える"
example = "6人卓でほかの誰かがストレートとフラッシュ待ちの確率は？"
count = 208
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "中級者", "6人" = "上級者" }
session_family = "ドロー"
```

### 相手が自分より高いフラッシュ

```toml question-pattern
id = "opponent_higher_flush"
mode = "D"
name = "相手が自分より高いフラッシュ"
purpose = "完成フラッシュ同士で相手に上回られる可能性を考える"
example = "6人卓でほかの誰かが自分より高いフラッシュの確率は？"
count = 208
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "中級者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手が同じペアで高いキッカー

```toml question-pattern
id = "opponent_same_pair_higher_kicker"
mode = "D"
name = "相手が同じペアで高いキッカー"
purpose = "同じペア同士で相手のキッカーに上回られる可能性を考える"
example = "6人卓でほかの誰かが同じペアで自分より強い確率は？"
count = 208
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience_by_players = { "2人" = "中級者", "6人" = "上級者" }
session_family = "完成役・所持札"
```

### 相手全員がボードとペアでない

```toml question-pattern
id = "all_opponents_miss_board"
mode = "D"
name = "相手全員がボードとペアでない"
purpose = "全相手がボードと同じカードを1枚も持たない可能性を考える"
example = "6人卓で相手全員がボードとペアでない確率は？"
count = 208
generator = "D相手役"
answer_type = "確率"
stages = ["フロップ", "ターン"]
players = [2, 6]
audience = "上級者"
session_family = "テーブル全体"
```

### 指定カードを持つ相手が1人だけ

```toml question-pattern
id = "exactly_one_opponent_target_rank"
mode = "D"
name = "指定カードを持つ相手が1人だけ"
purpose = "指定した数字・文字を持つ相手がちょうど1人になる可能性を考える"
example = "6人卓でAを持つ相手が1人だけの確率は？"
count = 208
generator = "D相手役"
answer_type = "確率"
stages = ["プリフロップ"]
players = [2, 6]
audience = "上級者"
session_family = "テーブル全体"
```

### 指定カードを持つ相手が2人以上

```toml question-pattern
id = "multiple_opponents_target_rank"
mode = "D"
name = "指定カードを持つ相手が2人以上"
purpose = "指定した数字・文字を複数の相手が持つ可能性を考える"
example = "6人卓でAを持つ相手が2人以上の確率は？"
count = 208
generator = "D相手役"
answer_type = "確率"
stages = ["プリフロップ"]
players = [6]
audience = "上級者"
session_family = "テーブル全体"
```
