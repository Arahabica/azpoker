# 暗算ポーカー

[![CI](https://github.com/Arahabica/azpoker/actions/workflows/ci.yml/badge.svg)](https://github.com/Arahabica/azpoker/actions/workflows/ci.yml)

ポーカーのドロー確率、2ハンドの強さ、プリフロップ勝率を2択で答える、10問1セットのブラウザドリルです。

UIは **Svelte 5**、アプリコードとCLI型検査は **TypeScript 7**、開発・ビルドは **Vite** を使います。トップ、履歴、利用規約、素材・開発者ページはビルド時に静的HTMLへ描画し、ブラウザでhydrateします。SvelteKit、CSSフレームワーク、外部コンポーネントライブラリは使っていません。

## 起動

Node.js 24.18.0とpnpm 10.30.1を使います。Node.jsのバージョンは`.node-version`、pnpmのバージョンは`package.json`で固定しています。

```sh
pnpm install
pnpm dev
```

Viteが表示したローカルURLをブラウザで開きます。

## Storybook

画面状態を固定してUIを確認する場合:

```sh
pnpm storybook
```

<http://localhost:6006/> で、トップ、問題の読み込み、開始準備、読み込みエラー、問題の回答前・正解・誤答・時間切れ、ゲーム終了、全問正解メッセージ12種類、履歴一覧・詳細、利用規約、素材・開発者、280px幅などを個別に確認できます。

操作テストとアクセシビリティ検査を初めて実行する前に、テスト用ブラウザを導入します。

```sh
pnpm exec playwright install chromium
pnpm check:storybook
```

## 検証

```sh
pnpm check
```

`check` はTypeScript 7の型検査、Svelteコンポーネント検査、ESLint、Prettierの整形検査、テスト、21,000問とJSON構成の検査、本番ビルド、Storybookの静的ビルドを順番に実行します。コミット前はこのコマンドを完走させます。

lintと整形を自動修正する場合:

```sh
pnpm lint:fix
pnpm format
```

GitHub Actionsでも、`main`へのpushとpull requestごとに依存関係を固定して同じコマンドを実行し、さらにStorybookの操作テストとアクセシビリティ検査を行います。

TypeScript 7.0はまだSvelteが利用するコンパイラAPIを提供していないため、`.ts`のCLI検査にはTypeScript 7、`.svelte`の埋め込み検査には互換用TypeScript 6を併用します。どちらも開発依存だけで、配信するJavaScriptには含まれません。

問題バンクを再生成する場合:

```sh
pnpm questions:build
```

問題パターンの正本は [`questions/patterns.md`](questions/patterns.md) です。日本語の名称、学習目的、出題例、件数、対象者、ステージ、出題系統を編集し、次のコマンドでPython・TypeScript用の定義を更新します。

```sh
pnpm patterns:build
```

`pnpm questions:build` は最初にパターン定義も更新します。生成済み定義と正本の不一致は `pnpm patterns:check` とCIで検出します。

トップページのスターティングハンド勝率表は [`questions/preflop-equities.md`](questions/preflop-equities.md) が正本です。問題バンクの計算値とは分けて管理し、次のコマンドで表示用JSONを更新します。

```sh
pnpm preflop-equities:build
```

OGP画像を現在のトップページから再生成する場合:

```sh
pnpm ogp:capture
```

Chromeを使って撮影専用状態のトップページを1200×630pxで描画し、`public/ogp.png`を更新します。Chromeを標準以外の場所へインストールしている場合は`CHROME_PATH`で実行ファイルを指定します。

## 公開

公開URL: <https://azpoker.me/>

Cloudflare Pagesプロジェクト `anzan-poker` はGitHubリポジトリ `Arahabica/azpoker` と連携しています。production branchは `main` です。pull requestを `main` へマージすると、Cloudflareが `pnpm check` を実行し、成功した `dist/` を本番へデプロイします。

Node.jsは `.node-version` の24.18.0、pnpmはCloudflareのビルド環境変数 `PNPM_VERSION=10.30.1` で固定しています。公開対象は生成済みの `dist/` だけです。

## ドキュメント

- [`SPEC.md`](SPEC.md): 長期的なゲーム仕様、確率、問題データ
- [`DESIGN.md`](DESIGN.md): 長期的なデザイン原則、色、文字、レスポンシブ方針
- [`assets/fonts/README.md`](assets/fonts/README.md): UIフォントの収録文字とサブセット再生成

## コード構成

- `src/App.svelte`: 公開ページの遷移、問題データの準備、フォーカス・効果音など画面遷移に伴う副作用
- `src/app-route.ts`: `/`、`/history`、`/terms`、`/credits`の解決とページメタ情報
- `src/game-flow.ts`: トップ、準備、出題、回答済み、結果を遷移させる純粋なTypeScript状態機械
- `src/types.ts`: カード、問題、回答、画面状態で共有するドメイン型
- `src/entry-server.ts`: 公開ページを静的HTMLへ描画するSSRエントリ
- `scripts/prerender.mjs`: SSR出力を各URLの `index.html` へ埋め込むビルド処理
- `scripts/capture-ogp.mjs`: トップの撮影専用状態から1200×630pxのOGP画像を再生成
- `src/screens/`: トップ、履歴、規約、素材、読み込み、開始準備、問題、結果の各画面
- `src/result-history.ts`: クイズ結果の検証、LocalStorage保存、50件上限と重複防止
- `src/components/HistoryList.svelte`: トップと履歴ページで共有する結果一覧
- `src/components/PublicPageShell.svelte`: 履歴、利用規約、素材ページの共通レイアウト
- `src/components/SiteFooter.svelte`: 利用規約、素材、開発者、お問い合わせへの共通リンク
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
- `questions/patterns.md`: 問題カテゴリ、学習目的、件数、対象者、出題系統の人間向け正本
- `questions/preflop-equities.md`: トップページに表示する6人卓・9人卓のプリフロップ勝率の正本
- `scripts/generate_question_patterns.py`: Markdownの正本からPython・TypeScript定義を生成
- `scripts/generate_preflop_equity_table.py`: 表示用の勝率正本からJSONを生成・検査
- `src/loading-timing.ts`: 短い読み込みでは表示せず、表示したローディングは最低時間を保つ遷移制御
- `src/result-summary.ts`: 正答数、回答速度、時間切れ数から結果文言・表示値を作る純粋関数
- `src/sound-effects.ts`: Web Audio APIによる効果音の取得・事前デコード・即時再生・停止
- `public/sounds/`: 開始、正解、不正解、時間警告、通常結果、満点の効果音
- `public/questions/`: 100問単位のJSON 210ファイルとmanifest（合計21,000問）
- `scripts/generate_large_question_bank.py`: 生成されたパターン定義に従う4モードの問題生成、確率計算、分割出力
