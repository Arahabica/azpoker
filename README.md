# 暗算ポーカー

[![CI](https://github.com/Arahabica/azpoker/actions/workflows/ci.yml/badge.svg)](https://github.com/Arahabica/azpoker/actions/workflows/ci.yml)

ポーカーのドロー確率、2ハンドの強さ、プリフロップ勝率を2択で答える、10問1セットのブラウザドリルです。

UIは **Svelte 5**、アプリコードとCLI型検査は **TypeScript 7**、開発・ビルドは **Vite** を使います。トップ画面はビルド時に静的HTMLへ描画し、ブラウザでhydrateします。SvelteKit、CSSフレームワーク、外部コンポーネントライブラリは使っていません。

## 起動

Node.js 24.18.0とpnpm 10.30.1を使います。Node.jsのバージョンは`.node-version`、pnpmのバージョンは`package.json`で固定しています。

```sh
pnpm install
pnpm dev
```

Viteが表示したローカルURLをブラウザで開きます。

## 検証

```sh
pnpm check
```

`check` はTypeScript 7の型検査、Svelteコンポーネント検査、ESLint、Prettierの整形検査、テスト、20,000問とJSON構成の検査、本番ビルドを順番に実行します。コミット前はこのコマンドを完走させます。

lintと整形を自動修正する場合:

```sh
pnpm lint:fix
pnpm format
```

GitHub Actionsでも、`main`へのpushとpull requestごとに依存関係を固定して同じコマンドを実行します。

TypeScript 7.0はまだSvelteが利用するコンパイラAPIを提供していないため、`.ts`のCLI検査にはTypeScript 7、`.svelte`の埋め込み検査には互換用TypeScript 6を併用します。どちらも開発依存だけで、配信するJavaScriptには含まれません。

問題バンクを再生成する場合:

```sh
pnpm questions:build
```

## 公開

Cloudflare Pages: <https://anzan-poker.pages.dev/>

Cloudflare PagesはGitHubリポジトリ `Arahabica/azpoker` と連携しています。production branchは `main` です。pull requestを `main` へマージすると、Cloudflareが `pnpm check` を実行し、成功した `dist/` を本番へデプロイします。

Node.jsは `.node-version` の24.18.0、pnpmはCloudflareのビルド環境変数 `PNPM_VERSION=10.30.1` で固定しています。公開対象は生成済みの `dist/` だけです。

## ドキュメント

- [`PLAN.md`](PLAN.md): ゲーム仕様、確率、問題データ、実装フェーズ
- [`DESIGN.md`](DESIGN.md): 現在の画面構成、ビジュアル、カード、表示文言
- [`RELEASE_PLAN.md`](RELEASE_PLAN.md): LP、履歴、利用規約、OGP、ドメインなどの公開準備
- [`assets/fonts/README.md`](assets/fonts/README.md): UIフォントの収録文字とサブセット再生成

## コード構成

- `src/App.svelte`: 問題データの準備と、フォーカス・効果音など画面遷移に伴う副作用
- `src/game-flow.ts`: トップ、準備、出題、回答済み、結果を遷移させる純粋なTypeScript状態機械
- `src/types.ts`: カード、問題、回答、画面状態で共有するドメイン型
- `src/entry-server.ts`: トップ画面を静的HTMLへ描画するSSRエントリ
- `scripts/prerender.mjs`: SSR出力を `dist/index.html` へ埋め込むビルド処理
- `src/screens/`: トップ、読み込み、開始準備、問題、結果の各画面
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
- `src/game.ts`: 問題選択と表示用の純粋関数
- `src/probability-engine.ts`: 確率計算の純粋関数
- `src/question-loader.ts`: manifestとA・B+C・Dの3パック遅延取得、メモリ再利用、直近問題の記録
- `src/loading-timing.ts`: 短い読み込みでは表示せず、表示したローディングは最低時間を保つ遷移制御
- `src/result-summary.ts`: 正答数、回答速度、時間切れ数から結果文言・表示値を作る純粋関数
- `src/sound-effects.ts`: Web Audio APIによる効果音の取得・事前デコード・即時再生・停止
- `public/sounds/`: 開始、正解、不正解、時間警告、通常結果、満点の効果音
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
