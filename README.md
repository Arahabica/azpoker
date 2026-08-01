# 暗算ポーカー

ポーカーのドロー確率を2択で答える、10問1セットのブラウザドリルです。
現在は `PLAN.md` のフェーズ3.7相当まで実装した、モバイル向けカードUI版です。

UIは **Svelte 5**、開発・ビルドは **Vite** を使います。SvelteKit、CSSフレームワーク、外部コンポーネントライブラリは使っていません。

## 起動

```sh
npm install
npm run dev
```

Viteが表示したローカルURLをブラウザで開きます。

## 検証

```sh
npm run check
```

`check` はテスト、問題バンクの再生成チェック、本番ビルドを順番に実行します。コミット前はこのコマンドを完走させます。

問題バンクを再生成する場合:

```sh
python3 scripts/generate_question_bank.py
```

## ドキュメント

- [`PLAN.md`](PLAN.md): ゲーム仕様、確率、問題データ、実装フェーズ
- [`DESIGN.md`](DESIGN.md): 現在の画面構成、ビジュアル、カード、表示文言
- [`assets/fonts/README.md`](assets/fonts/README.md): UIフォントの収録文字とサブセット再生成

## コード構成

- `src/App.svelte`: セッションと画面遷移
- `src/screens/`: トップ、問題、結果の各画面
- `src/components/Board.svelte`: ボードの5列配置と同時フェード
- `src/components/HoleCards.svelte`: 手札2枚の重なりと傾き
- `src/components/PlayingCard.svelte`: サイズ・回転・色を受け持つ共通カード枠
- `src/components/card-faces/CardFace.svelte`: 採用したランクとスートの配置
- `src/components/ActionButton.svelte`: 主要・副操作ボタンの共通表示
- `src/components/ChoiceButton.svelte`: 選択肢の中央配置と文字のベースライン
- `src/components/AnswerSheet.svelte`: 回答後のパネル
- `styles.css`: フォント定義、デザイントークン、リセット、全体のアクセシビリティ設定だけを持つグローバルCSS
- `src/game.js`: 問題選択と表示用の純粋関数
- `src/probability-engine.js`: 確率計算の純粋関数
- `src/question-bank.js`: スクリプトから生成する100問

## 現在の仕様判断

- フェーズ表でモードB・Cはフェーズ8に置かれているため、現在の10問はモードAのみです。
- 1セットはプリフロップ2問、フロップ4問、ターン4問です。順番は毎回混ぜます。
- フロップ／ターンは、各ステージ内で同じカテゴリが重ならないように選びます。
- 特定ランクの出現問題は、そのランクを手札に1枚持ち、来ればペア以上になる場合だけ出題します。
- 特定ランクの出現と3カードを問う問題を、毎セットに含めます。
- コンボドローは、フラッシュとストレートの両方を完成させる1枚を二重計上しません。
- ポケットペアがリバーまでに3カード以上になる確率は19.2%として出題します。
