# 暗算ポーカー

ポーカーのドロー確率、2ハンドの強さ、プリフロップ勝率を2択で答える、10問1セットのブラウザドリルです。

UIは **Svelte 5**、開発・ビルドは **Vite** を使います。トップ画面はビルド時に静的HTMLへ描画し、ブラウザでhydrateします。SvelteKit、CSSフレームワーク、外部コンポーネントライブラリは使っていません。

## 起動

```sh
pnpm install
pnpm dev
```

Viteが表示したローカルURLをブラウザで開きます。

## 検証

```sh
pnpm check
```

`check` はテスト、20,000問とJSON構成の検査、本番ビルドを順番に実行します。コミット前はこのコマンドを完走させます。

問題バンクを再生成する場合:

```sh
pnpm questions:build
```

## 公開

Cloudflare Pages: <https://anzan-poker.pages.dev/>

公開方式はDirect Uploadです。次のコマンドは検証と本番ビルドを完走してから、生成された `dist/` だけを `anzan-poker` プロジェクトの本番環境へアップロードします。

```sh
pnpm deploy:pages
```

ソースコードとGit履歴はアップロードしません。Direct Uploadで作成した同じPagesプロジェクトはGit連携方式へ変更できないため、自動デプロイへ移行する場合は別プロジェクトを作成します。

## ドキュメント

- [`PLAN.md`](PLAN.md): ゲーム仕様、確率、問題データ、実装フェーズ
- [`DESIGN.md`](DESIGN.md): 現在の画面構成、ビジュアル、カード、表示文言
- [`assets/fonts/README.md`](assets/fonts/README.md): UIフォントの収録文字とサブセット再生成

## コード構成

- `src/App.svelte`: セッション、準備、画面遷移、効果音の呼び分け
- `src/entry-server.js`: トップ画面を静的HTMLへ描画するSSRエントリ
- `scripts/prerender.mjs`: SSR出力を `dist/index.html` へ埋め込むビルド処理
- `src/screens/`: トップ、開始準備、問題、結果の各画面
- `src/components/Board.svelte`: ボードの5列配置、サイズ、同時モーション
- `src/components/HoleCards.svelte`: 手札2枚のサイズ、重なり、角度、モーション
- `src/components/HandComparison.svelte`: 2つの手札を直接選ぶ比較問題
- `src/components/LogoCards.svelte`: ロゴカードの内容、サイズ、重なり、角度、モーション
- `src/components/PlayingCard.svelte`: カード情報、共通カード枠、色、読み上げ
- `src/components/card-faces/CardFace.svelte`: 採用したランクとスートの配置
- `src/components/ActionButton.svelte`: 主要・副操作ボタンの共通表示
- `src/components/ChoiceButton.svelte`: 選択肢の中央配置と文字のベースライン
- `src/components/AnswerSheet.svelte`: 回答後のパネル
- `src/components/LeaveConfirmationSheet.svelte`: 回答後に開く退出確認パネル
- `styles.css`: フォント定義、デザイントークン、リセット、全体のアクセシビリティ設定だけを持つグローバルCSS
- `src/game.js`: 問題選択と表示用の純粋関数
- `src/probability-engine.js`: 確率計算の純粋関数
- `src/question-loader.js`: manifestとA・B+C・Dの3パック遅延取得、メモリ再利用、直近問題の記録
- `src/result-summary.js`: 正答数、回答速度、時間切れ数から結果文言・表示値を作る純粋関数
- `src/sound-effects.js`: Web Audio APIによる効果音の取得・事前デコード・即時再生・停止
- `public/sounds/`: 開始、正解、不正解、通常結果、満点の効果音
- `public/questions/`: 100問単位のJSON 200ファイルとmanifest（合計20,000問）
- `scripts/generate_large_question_bank.py`: 4モードの問題生成、確率計算、分割出力

## 現在の仕様判断

- 1セットはモードA 5問、B 2問、C 1問、D 2問です。順番は毎回混ぜます。
- 全体のステージ比率はプリフロップ3問、フロップ4問、ターン3問です。
- 基本原則で判断する問題を8問、複数要素を組み合わせる問題を2問出します。
- モードAの5問はカテゴリを重複させず、0%問題は最大1問です。
- 特定ランクの出現問題は、そのランクを手札に1枚持ち、来ればペア以上になる場合だけ出題します。
- 特定ランクがスリーになる問題、ツーペア、フルハウス、フォーカードも扱います。
- コンボドローは、フラッシュとストレートの両方を完成させる1枚を二重計上しません。
- 選択肢は問題ごとの典型的な勘違いから作り、別人数の勝率など明らかな捨て選択肢は使いません。
