import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CARD_SUITS } from "../src/components/card-suits.ts";
import { LANDING_QUIZ_EXAMPLE } from "../src/landing-quiz-example.ts";
import { calculateProbability } from "../src/probability-engine.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const html = read("index.html");
const app = read("src/App.svelte");
const gameFlow = read("src/game-flow.ts");
const main = read("src/main.ts");
const serverEntry = read("src/entry-server.ts");
const prerender = read("scripts/prerender.mjs");
const packageJson = JSON.parse(read("package.json"));
const landing = read("src/screens/LandingScreen.svelte");
const historyScreen = read("src/screens/HistoryScreen.svelte");
const termsScreen = read("src/screens/TermsScreen.svelte");
const creditsScreen = read("src/screens/CreditsScreen.svelte");
const prepare = read("src/screens/PrepareScreen.svelte");
const preparationLoading = read("src/screens/PreparationLoadingScreen.svelte");
const quiz = read("src/screens/QuizScreen.svelte");
const result = read("src/screens/ResultScreen.svelte");
const reviewResult = read("src/screens/ReviewResultScreen.svelte");
const actionButton = read("src/components/ActionButton.svelte");
const answerSheet = read("src/components/AnswerSheet.svelte");
const leaveConfirmationSheet = read(
  "src/components/LeaveConfirmationSheet.svelte",
);
const board = read("src/components/Board.svelte");
const card = read("src/components/PlayingCard.svelte");
const choiceButton = read("src/components/ChoiceButton.svelte");
const handComparison = read("src/components/HandComparison.svelte");
const holeCards = read("src/components/HoleCards.svelte");
const logoCards = read("src/components/LogoCards.svelte");
const cardSuits = read("src/components/card-suits.ts");
const cardFace = read("src/components/card-faces/CardFace.svelte");
const mixedFontText = read("src/components/MixedFontText.svelte");
const quizProgressTimer = read("src/components/QuizProgressTimer.svelte");
const historyPanel = read("src/components/HistoryPanel.svelte");
const historyList = read("src/components/HistoryList.svelte");
const historyDetail = read("src/components/HistoryDetail.svelte");
const historyQuestionCard = read("src/components/HistoryQuestionCard.svelte");
const difficultyBadge = read("src/components/DifficultyBadge.svelte");
const holdemOverview = read("src/components/HoldemOverview.svelte");
const landingQuizPreview = read("src/components/LandingQuizPreview.svelte");
const publicPageShell = read("src/components/PublicPageShell.svelte");
const siteFooter = read("src/components/SiteFooter.svelte");
const questionTimer = read("src/question-timer.ts");
const resultSummary = read("src/result-summary.ts");
const soundEffects = read("src/sound-effects.ts");
const fontBuildScript = read("scripts/build_font_subsets.mjs");
const styles = read("styles.css");
const uiTiming = read("src/ui-timing.ts");
const loadingTiming = read("src/loading-timing.ts");
const viteConfig = read("vite.config.ts");
const tsconfig = read("tsconfig.json");
const types = read("src/types.ts");
const cardFontPath = path.join(
  root,
  "assets",
  "fonts",
  "arbutus-slab",
  "ArbutusSlab-Regular-latin.woff2",
);
const landingFontPath = path.join(
  root,
  "assets",
  "fonts",
  "kosugi-maru",
  "KosugiMaru-Landing.woff2",
);
const landingBodyFontPath = path.join(
  root,
  "assets",
  "fonts",
  "kosugi-maru",
  "KosugiMaru-LandingBody.woff2",
);
const gameFontPath = path.join(
  root,
  "assets",
  "fonts",
  "kosugi-maru",
  "KosugiMaru-Game.woff2",
);
const mplusFontPath = path.join(
  root,
  "assets",
  "fonts",
  "m-plus-rounded-1c",
  "MPLUSRounded1c-UI.woff2",
);
test("Svelte + Viteのアプリを構成する", () => {
  assert.match(html, /<div id="app"><!--app-html--><\/div>/);
  assert.match(html, /type="module" src="\/src\/main\.ts"/);
  assert.match(viteConfig, /svelte\(\)/);
  assert.match(viteConfig, /assetsInlineLimit: 0/);
});

test("TypeScript 7で本番コードを検査し、Svelteの型検査も併用する", () => {
  assert.match(
    packageJson.devDependencies["@typescript/native"],
    /^npm:typescript@\^7\./,
  );
  assert.match(
    packageJson.devDependencies.typescript,
    /^npm:@typescript\/typescript6@/,
  );
  assert.match(packageJson.scripts["typecheck:ts"], /^tsc --noEmit/);
  assert.match(packageJson.scripts["typecheck:svelte"], /^svelte-check/);
  assert.match(packageJson.scripts.check, /pnpm run typecheck/);
  assert.match(tsconfig, /"strict": true/);
  assert.match(tsconfig, /"noUncheckedIndexedAccess": true/);
  assert.match(types, /export type Question =/);

  for (const component of [
    app,
    landing,
    historyScreen,
    termsScreen,
    creditsScreen,
    prepare,
    quiz,
    result,
    reviewResult,
    actionButton,
    answerSheet,
    leaveConfirmationSheet,
    quizProgressTimer,
    board,
    holeCards,
    logoCards,
    card,
    cardFace,
    choiceButton,
    mixedFontText,
    historyPanel,
    historyList,
    historyDetail,
    historyQuestionCard,
    difficultyBadge,
    holdemOverview,
    landingQuizPreview,
    publicPageShell,
    siteFooter,
  ]) {
    assert.match(component, /<script lang="ts">/);
  }
});

test("公開ページをビルド時に描画し、ブラウザでhydrateする", () => {
  assert.match(serverEntry, /import \{ render \} from "svelte\/server"/);
  assert.match(serverEntry, /return render\(App, \{/);
  assert.match(serverEntry, /initialPath: normalizeAppPath\(pathname\)/);
  assert.match(prerender, /import\(serverOutput\)/);
  assert.match(prerender, /for \(const page of pages\)/);
  assert.match(prerender, /history\/index\.html/);
  assert.match(prerender, /history-detail\/index\.html/);
  assert.match(prerender, /const historyDetailHtml = template/);
  assert.match(prerender, /terms\/index\.html/);
  assert.match(prerender, /credits\/index\.html/);
  assert.match(
    prerender,
    /replace\(headOutlet, head\)\.replace\(outlet, body\)/,
  );
  assert.match(prerender, /rm\(serverOutputDirectory/);
  assert.match(main, /import \{ hydrate, mount \} from "svelte"/);
  assert.match(main, /const shouldHydrate = serverPath === initialPath/);
  assert.match(main, /target\.replaceChildren\(\)/);
  assert.match(main, /props: \{ initialPath \}/);
  assert.match(
    packageJson.scripts.build,
    /vite build --ssr src\/entry-server\.ts --outDir \.prerender/,
  );
  assert.match(packageJson.scripts.build, /node scripts\/prerender\.mjs/);
  assert.match(app, /rel="canonical" href={canonicalUrl}/);
  assert.match(app, /property="og:image" content={OGP_IMAGE_URL}/);
  assert.match(app, /name="twitter:card" content="summary_large_image"/);
});

test("公開ページとゲーム画面を独立したSvelteコンポーネントで切り替える", () => {
  assert.match(app, /flow\.status === "top"/);
  assert.match(app, /flow\.status === "ready"/);
  assert.match(app, /flow\.status === "answering"/);
  assert.match(app, /flow\.status === "result"/);
  assert.match(app, /<LandingScreen/);
  assert.match(app, /<PrepareScreen/);
  assert.match(app, /<QuizScreen/);
  assert.match(app, /<ResultScreen/);
  assert.match(app, /<HistoryScreen/);
  assert.match(app, /<TermsScreen/);
  assert.match(app, /<CreditsScreen/);
  assert.match(landing, /id="start-game"/);
  assert.match(result, /id="back-home"/);
  assert.match(historyScreen, /showHeading={false}/);
  assert.doesNotMatch(historyScreen, /直近50回の結果/);
  assert.match(historyScreen, /<HistoryPanel entries={history} onSelect=/);
  assert.match(historyScreen, /<HistoryDetail entry={selectedEntry}/);
  assert.match(app, /createHistoryDetailPath\(id\)/);
  assert.match(app, /openHistoryDetail\(id, "top"\)/);
  assert.match(app, /openHistoryDetail\(id, "history"\)/);
  assert.match(app, /historyDetailOrigin !== "direct"/);
  assert.match(historyScreen, /navigationLabel={detailId/);
  assert.match(historyScreen, /onHeaderNavigate={detailId/);
  assert.doesNotMatch(historyDetail, /back-to-history|履歴一覧に戻る/);
  assert.match(publicPageShell, /class="visually-hidden"/);
});

test("トップLPは問題、答え、アプリ説明、ルール説明の順で見せる", () => {
  assert.match(landing, /確率を瞬時に判断して、/);
  assert.match(landing, /もっと強くなろう！/);
  assert.equal(landing.match(/label="クイズをはじめる"/g)?.length, 2);
  assert.match(landing, /{#if recentHistory\.length > 0}/);
  assert.match(landing, /\$derived\(history\.slice\(0, 2\)\)/);
  assert.match(landing, /showMoreHistory = \$derived\(history\.length > 2\)/);
  assert.match(landing, /min-height: 100dvh/);
  assert.ok(
    landing.indexOf("{#if recentHistory.length > 0}") <
      landing.indexOf('id="start-game"'),
  );
  assert.ok(
    landing.indexOf("<HistoryPanel") < landing.indexOf('id="start-game"'),
  );
  assert.match(historyPanel, /最近の履歴\s*<\/h2>/);
  assert.match(historyPanel, /<HistoryList {entries} \/>/);
  assert.match(historyPanel, /font-family:[\s\S]*"Kosugi Maru Landing"/);
  assert.match(historyPanel, /{#if showMore}/);
  assert.match(historyList, /formatRelativeHistoryTime/);
  assert.match(historyList, /class="history-row"/);
  assert.match(
    historyList,
    /grid-template-columns: minmax\(0, 1fr\) auto auto/,
  );
  assert.doesNotMatch(historyList, /compact\?:|{#if compact}/);
  assert.match(
    landing,
    /<HistoryPanel[\s\S]*entries={recentHistory}[\s\S]*showMore={showMoreHistory}/,
  );
  assert.doesNotMatch(
    landing.match(/\.landing-body \{([^}]*)\}/)?.[1] ?? "",
    /border-top/,
  );
  assert.match(landing, /<LandingQuizPreview \/>/);
  assert.match(landing, /<HoldemOverview \/>/);
  assert.ok(
    landing.indexOf("<LandingQuizPreview") <
      landing.indexOf('class="training-value"'),
  );
  assert.ok(
    landing.indexOf('class="training-value"') <
      landing.indexOf("<HoldemOverview"),
  );
  assert.doesNotMatch(landing, /section-number|feature-list/);
  assert.doesNotMatch(landing, /10問で、すばやく反復/);
  assert.match(
    landing,
    /このアプリはテキサスホールデムの10問の確率問題を制限時間付きで解いていくクイズアプリです。/,
  );
  assert.match(landing, /<p class="training-lead">/);
  assert.doesNotMatch(landing, /<h2[^>]*id="training-value-title"/);
  assert.match(landing, /ポーカーの基礎体力を上げていきましょう。/);
  assert.match(landing, /テキサスホールデムって何？/);
  assert.match(
    landing,
    /\.landing-content \{[\s\S]*?padding: 0 var\(--lp-padding-horizontal\) 3\.5rem;/,
  );
  assert.match(
    landing,
    /\.training-lead,\s*\.training-copy p \{[\s\S]*?text-align: left;/,
  );

  assert.equal(LANDING_QUIZ_EXAMPLE.prompt, "フラッシュの確率は？");
  assert.match(
    landingQuizPreview,
    /<Board[\s\S]*cards={LANDING_QUIZ_EXAMPLE\.board}/,
  );
  assert.match(
    landingQuizPreview,
    /<HoleCards cards={LANDING_QUIZ_EXAMPLE\.hole}/,
  );
  assert.match(landingQuizPreview, /class="quiz-challenge"/);
  assert.match(
    landingQuizPreview,
    /\.quiz-challenge \{[\s\S]*min-height: 100dvh/,
  );
  assert.match(landingQuizPreview, /答えは<strong>約/);
  assert.doesNotMatch(landingQuizPreview, /question-count|収録問題数/);
  assert.match(landingQuizPreview, /\.preview-cards \{[\s\S]*gap: 0\.85rem/);
  assert.match(
    landingQuizPreview,
    /\.preview-choices \{[\s\S]*margin-top: 0\.35rem/,
  );

  const exampleProbability = calculateProbability({
    hole: LANDING_QUIZ_EXAMPLE.hole,
    board: LANDING_QUIZ_EXAMPLE.board,
    target: LANDING_QUIZ_EXAMPLE.target,
  });
  assert.equal(
    exampleProbability.percent.toFixed(1),
    LANDING_QUIZ_EXAMPLE.actualPercent.toFixed(1),
  );
  assert.equal(LANDING_QUIZ_EXAMPLE.answer, "35%");

  assert.match(
    holdemOverview,
    /<h3 id="holdem-title">テキサスホールデム<\/h3>/,
  );
  assert.match(holdemOverview, /テーブルのカード 5枚/);
  assert.match(holdemOverview, /手札 2枚/);
  assert.match(holdemOverview, /PlayingCard/);
  assert.match(holdemOverview, /href="https:\/\/www\.ajpc\.jp\/about-poker\/"/);
  assert.match(holdemOverview, /target="_blank"/);
  assert.match(holdemOverview, /rel="external noopener"/);
  assert.doesNotMatch(holdemOverview, /このアプリで取り扱うポーカーです/);
});

test("誤答を復習し、履歴では1セットの問題と解説を縦に振り返る", () => {
  assert.match(result, /label="問題を続ける"/);
  assert.match(result, /{#if canReview}/);
  assert.match(result, /label="復習する"/);
  assert.ok(
    result.indexOf('label="問題を続ける"') < result.indexOf('label="復習する"'),
  );
  assert.match(app, /type: "START_REVIEW"/);
  assert.match(app, /repeatCurrent/);
  assert.match(app, /session\.push\(repeatedQuestion\)/);
  assert.doesNotMatch(reviewResult, /message \|\|/);
  assert.match(app, /reviewCompletionMessage = getReviewCompletionMessage\(\)/);
  assert.match(reviewResult, /class="review-complete-icon"/);
  assert.match(reviewResult, /viewBox="0 0 24 24"/);
  assert.match(reviewResult, /M21\.801 10A10 10 0 1 1 17 3\.335/);
  assert.match(reviewResult, /m9 11 3 3L22 4/);
  assert.match(reviewResult, /{#each message as phrase/);
  assert.match(reviewResult, /<MixedFontText text={phrase} \/>/);
  assert.match(reviewResult, /class="review-message-phrase"/);
  assert.match(reviewResult, /index < message\.length - 1}<wbr \/>/);
  assert.match(
    result,
    /<MixedFontText text={summary\.headline} messageWrap \/>/,
  );
  const reviewIconStyle =
    reviewResult.match(/\.review-complete-icon \{([\s\S]*?)\n {2}\}/)?.[1] ??
    "";
  assert.doesNotMatch(reviewIconStyle, /background|border|box-shadow/);
  assert.match(reviewIconStyle, /color: #fff/);
  assert.doesNotMatch(reviewResult, /REVIEW COMPLETE/);
  assert.doesNotMatch(reviewResult, /間違えた問題をすべて解き直しました/);
  assert.match(reviewResult, /label="トップページに戻る"/);
  assert.match(reviewResult, /label="問題を続ける"/);
  assert.match(quiz, /reviewMode/);
  assert.match(quiz, /<DifficultyBadge difficulty={question\.difficulty}/);

  assert.match(historyDetail, /class="question-history"/);
  assert.match(historyDetail, /<HistoryQuestionCard/);
  assert.match(historyQuestionCard, /<Board cards={question\.board}/);
  assert.match(historyQuestionCard, /あなたの回答/);
  assert.match(historyQuestionCard, /正解/);
  assert.doesNotMatch(historyQuestionCard, /answer-summary|<dl/);
  assert.match(historyQuestionCard, /解説/);
  assert.match(historyQuestionCard, /<DifficultyBadge/);
});

test("共通フッターは感想の案内、Xへの連絡、3つのサイト情報だけを表示する", () => {
  assert.match(siteFooter, /ご意見・ご感想お待ちしております！/);
  assert.match(siteFooter, /Xで開発者に連絡する/);
  assert.match(siteFooter, />利用規約<\/a/);
  assert.match(siteFooter, />素材<\/a>/);
  assert.match(siteFooter, />開発者<\/a>/);
  assert.match(siteFooter, /href="\/credits#materials"/);
  assert.match(siteFooter, /href="\/credits#developer"/);
  assert.match(creditsScreen, /<section id="materials">/);
  assert.match(creditsScreen, /<section id="developer">/);
});

test("ゲーム進行を純粋なTypeScript状態機械で管理する", () => {
  for (const status of [
    "top",
    "preparing",
    "ready",
    "preparation-error",
    "answering",
    "answered",
    "result",
  ]) {
    assert.match(gameFlow, new RegExp(`status: "${status}"`));
  }

  assert.match(app, /let flow = \$state\(createInitialGameFlow\(\)\)/);
  assert.match(app, /transitionGameFlow\(flow,/);
  assert.match(app, /getQuestionIndex\(flow\)/);
  assert.match(app, /getAnswerResult\(flow\)/);
  assert.doesNotMatch(
    app,
    /let (?:view|starting|preparationReady|currentIndex|answerResult) = \$state/,
  );
});

test("アクセントカラーに黄色を使う", () => {
  const rootBlock = styles.match(/:root \{([^}]*)\}/)?.[1] ?? "";
  assert.match(rootBlock, /--accent: rgb\(241 196 15\);/);
  assert.match(rootBlock, /--accent-emphasis: rgb\(241 196 15\);/);
});

test("UIフォントを自己配信し、ヒーローとLP本文のKosugiを分ける", () => {
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.doesNotMatch(html, /<link[^>]+rel="preconnect"/);
  const landingPreload =
    html.match(/<link[^>]+KosugiMaru-Landing\.woff2[^>]*>/)?.[0] ?? "";
  assert.match(landingPreload, /rel="preload"/);
  assert.match(landingPreload, /as="font"/);
  assert.match(landingPreload, /type="font\/woff2"/);
  assert.match(landingPreload, /crossorigin/);
  assert.doesNotMatch(html, /KosugiMaru-LandingBody\.woff2/);
  assert.match(
    styles,
    /font-family: "Kosugi Maru Landing"[\s\S]*KosugiMaru-Landing\.woff2/,
  );
  assert.match(
    styles,
    /font-family: "Kosugi Maru Landing Body"[\s\S]*KosugiMaru-LandingBody\.woff2/,
  );
  assert.match(
    styles,
    /font-family: "Kosugi Maru Game"[\s\S]*KosugiMaru-Game\.woff2/,
  );
  assert.match(
    styles,
    /font-family: "M PLUS Rounded 1c UI"[\s\S]*MPLUSRounded1c-UI\.woff2/,
  );
  assert.match(
    landing,
    /\.landing-hero \{[\s\S]*"M PLUS Rounded 1c UI", "Kosugi Maru Landing", sans-serif;/,
  );
  assert.match(
    landing,
    /\.landing-body \{[\s\S]*"M PLUS Rounded 1c UI", "Kosugi Maru Landing Body", sans-serif;/,
  );
  assert.match(
    prepare,
    /\.prepare-screen \{[\s\S]*font-family: "M PLUS Rounded 1c UI"/,
  );
  assert.match(
    quiz,
    /\.game-screen \{[\s\S]*font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;/,
  );
  assert.match(
    result,
    /\.result-screen \{[\s\S]*font-family: "M PLUS Rounded 1c UI"/,
  );
  assert.match(styles, /--card-rank-font: "Arbutus Slab", serif/);
  assert.doesNotMatch(styles, /fonts\.googleapis/);

  const landingFontSize = fs.statSync(landingFontPath).size;
  const landingBodyFontSize = fs.statSync(landingBodyFontPath).size;
  const gameFontSize = fs.statSync(gameFontPath).size;
  const mplusFontSize = fs.statSync(mplusFontPath).size;
  assert.ok(landingFontSize > 0 && landingFontSize < 12_000);
  assert.ok(
    landingBodyFontSize > landingFontSize && landingBodyFontSize < 35_000,
  );
  assert.ok(gameFontSize > landingBodyFontSize && gameFontSize < 60_000);
  assert.ok(mplusFontSize > 0 && mplusFontSize < 10_000);
  assert.match(
    fontBuildScript,
    /暗算ポーカー確率を瞬時に判断して、もっと強くなろう！クイズをはじめる/,
  );
  assert.match(fontBuildScript, /LandingQuizPreview\.svelte/);
  assert.match(fontBuildScript, /HoldemOverview\.svelte/);
  assert.match(
    fontBuildScript,
    /0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\./,
  );
  assert.match(fontBuildScript, /LandingScreen\.svelte/);
  assert.match(fontBuildScript, /\(\?:ts\|svelte\)/);
  assert.match(landing, /\.brand-lockup h1 \{[\s\S]*line-height: 1;/);
  assert.match(
    logoCards,
    /\.logo-cards \{[\s\S]*height: var\(--logo-cards-height, 8\.5rem\);/,
  );

  assert.match(quiz, /MixedFontText text=\{question\.prompt\} phraseWrap/);
  assert.match(mixedFontText, /\[A-Za-z0-9\.\]/);
  assert.doesNotMatch(mixedFontText, /A-Za-z0-9%/);
  assert.match(mixedFontText, /splitAtNaturalBreaks/);
  assert.match(mixedFontText, /<wbr \/>/);
  assert.match(mixedFontText, /<\/span>\{#if wrapsPhrases/);
  assert.match(mixedFontText, /\.phrase \{[\s\S]*white-space: nowrap/);
  assert.match(
    mixedFontText,
    /<span class="mixed-font-text">[\s\S]*\{#each phrases[\s\S]*fontParts\(phrase\)/,
  );
  assert.match(mixedFontText, /\.mixed-font-text \{[\s\S]*display: inline/);
  assert.match(
    mixedFontText,
    /\.mplus \{[\s\S]*font-family: "M PLUS Rounded 1c UI"[\s\S]*font-weight: 400/,
  );
  assert.match(choiceButton, /\.choice-value \{[\s\S]*font-weight: 400/);
  assert.match(answerSheet, /\.actual-probability \{[\s\S]*font-weight: 400/);
  assert.match(result, /\.stat-value \{[\s\S]*font-weight: 400/);
});

test("問題画面はボードを上、傾けた手札を下に置く", () => {
  assert.ok(quiz.indexOf("<Board") < quiz.indexOf("<HoleCards"));
  assert.match(quiz, /<Board cards=\{question\.board\}/);
  assert.match(quiz, /<HoleCards cards=\{question\.hole\}/);
  assert.match(board, /aria-label="コミュニティカード"/);
  assert.match(holeCards, /class="hand-cards" role="group" aria-label="手札"/);
  assert.match(board, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
});

test("選択肢をコンポーネント化し、中央配置とベースラインを分ける", () => {
  assert.match(quiz, /import ChoiceButton/);
  assert.match(quiz, /<ChoiceButton[\s\S]*value=\{choice\}/);
  assert.doesNotMatch(quiz, /<button[\s\S]*class="choice"/);
  assert.match(
    choiceButton,
    /\.choice \{[\s\S]*display: grid;[\s\S]*place-items: center;/,
  );
  assert.match(
    choiceButton,
    /\.choice-content \{[\s\S]*align-items: baseline;/,
  );
  const affixRule =
    choiceButton.match(
      /\.choice-qualifier,\s*\.choice-percent \{([^}]*)\}/,
    )?.[1] ?? "";
  assert.match(affixRule, /font-size: [^;]+;/);
  assert.match(choiceButton, /<span class="choice-value">\{number\}<\/span>/);
  assert.match(choiceButton, /<span class="choice-percent">\{suffix\}<\/span>/);
});

test("選択肢は初回描画から領域を確保し、表示時に卓を動かさない", () => {
  assert.match(
    quiz,
    /const choicesConcealed = \$derived\(!choicesReady \|\| Boolean\(answerResult\)\)/,
  );
  assert.doesNotMatch(quiz, /hidden=\{!choicesReady\}/);
  assert.match(quiz, /class:is-concealed=\{choicesConcealed\}/);
  assert.match(quiz, /disabled=\{choicesConcealed\}/);
  const concealedRule =
    quiz.match(/\.choices\.is-concealed \{([^}]*)\}/)?.[1] ?? "";
  assert.match(concealedRule, /visibility: hidden/);
  assert.match(concealedRule, /pointer-events: none/);
  assert.doesNotMatch(concealedRule, /display:\s*none/);
});

test("カード枠とカード面を分け、SVGスートと10表記に対応する", () => {
  assert.match(card, /import \{ cardDetails \}/);
  assert.match(card, /import \{ CARD_SUITS \}/);
  assert.match(card, /import CardFace/);
  assert.match(card, /CARD_SUITS\[details\.suit\]/);
  assert.match(card, /<CardFace/);
  assert.match(card, /container-type: inline-size/);
  assert.match(card, /--corner-center-x: 22%/);
  assert.match(card, /data-rank="Q"[\s\S]*--rank-optical-shift: -1\.5cqi/);
  assert.match(card, /data-rank="K"[\s\S]*--rank-optical-shift: -2cqi/);
  assert.match(cardFace, /viewBox=\{suitViewBox\}/);
  assert.match(cardFace, /\{rank\}/);
  assert.match(cardFace, /font-size: 34cqi/);
  assert.match(cardFace, /left: var\(--corner-center-x\)/);
  assert.match(cardFace, /translateX\(-50%\)/);
  assert.match(styles, /font-family: "Arbutus Slab"/);
  assert.match(
    styles,
    /url\("\.\/assets\/fonts\/arbutus-slab\/ArbutusSlab-Regular-latin\.woff2"\)/,
  );
  assert.ok(fs.statSync(cardFontPath).size > 0);
});

test("PlayingCardはカードの描画と読み上げだけを担当する", () => {
  assert.match(
    card,
    /let \{ card, decorative = false \}(?:: Props)? = \$props\(\)/,
  );
  assert.match(card, /role=\{decorative \? undefined : "img"\}/);
  assert.match(
    card,
    /aria-label=\{decorative \? undefined : details\.ariaLabel\}/,
  );
  assert.match(card, /width: 100%/);
  assert.doesNotMatch(card, /variant|index|CARD_ANGLES|start-angle|end-angle/);
  assert.doesNotMatch(card, /@keyframes|animation:|transform:|playing-card--/);
});

test("カードは4つの共通スートを使う", () => {
  assert.deepEqual(Object.keys(CARD_SUITS), ["h", "d", "s", "c"]);
  assert.match(cardSuits, /export const CARD_SUITS/);
  assert.match(cardSuits, /const SUIT_PEDESTAL_PATH/);
  assert.equal(
    cardSuits.match(/\$\{SUIT_PEDESTAL_PATH\}/g)?.length,
    2,
    "スペードとクラブが同じ台座パスを使う",
  );
});

test("トップと問題画面で共通のカード面を使う", () => {
  assert.match(landing, /LogoCards/);
  assert.match(logoCards, /PlayingCard/);
  assert.match(logoCards, /decorative/);
  assert.match(board, /PlayingCard/);
  assert.match(holeCards, /PlayingCard/);
  assert.deepEqual(
    fs.readdirSync(path.join(root, "src", "components", "card-faces")),
    ["CardFace.svelte"],
  );
  assert.match(cardFace, /width: 19cqi/);
});

test("480pxのモバイル領域とPCの左右余白を持つ", () => {
  assert.match(styles, /--app-max-width: 480px/);
  assert.match(app, /max-width: var\(--app-max-width\)/);
  assert.match(app, /@media \(min-width: 481px\)/);
  assert.match(app, /margin: 0 auto/);
});

test("ボード・手札・ロゴは利用側で共通トークンを使う", () => {
  assert.match(quiz, /import Board from/);
  assert.match(
    quiz,
    /<Board cards=\{question\.board\} revealKey=\{currentIndex\}/,
  );
  assert.doesNotMatch(app, /visibleBoard|boardCards|REVEAL_DELAY_MS/);
  assert.match(uiTiming, /CHOICE_REVEAL_DELAY_MS = 300/);
  assert.doesNotMatch(board, /REVEAL_DELAY_MS|animation-delay/);
  assert.doesNotMatch(
    `${card}\n${holeCards}\n${logoCards}`,
    /animation-delay|--deal-index|42ms|240ms/,
  );
  assert.match(board, /`\$\{revealKey\}-\$\{card\}-\$\{index\}`/);
  assert.match(styles, /--card-reveal-duration:/);
  assert.match(styles, /--card-reveal-easing:/);
  assert.match(styles, /--card-reveal-start-opacity:/);
  assert.match(styles, /--card-reveal-start-y:/);
  assert.match(
    board,
    /\.board-card \{[\s\S]*animation:[\s\S]*reveal-board-card[\s\S]*var\(--card-reveal-duration\)[\s\S]*var\(--card-reveal-easing\)[\s\S]*both;/,
  );
  assert.match(
    holeCards,
    /\.hand-card \{[\s\S]*animation:[\s\S]*reveal-hole-card[\s\S]*var\(--card-reveal-duration\)[\s\S]*var\(--card-reveal-easing\)[\s\S]*both;/,
  );
  assert.match(
    logoCards,
    /\.logo-card \{[\s\S]*animation:[\s\S]*reveal-logo-card[\s\S]*var\(--card-reveal-duration\)[\s\S]*var\(--card-reveal-easing\)[\s\S]*both;/,
  );
  const boardAnimation =
    board.match(/@keyframes reveal-board-card \{([\s\S]*?)\n {2}\}/)?.[1] ?? "";
  const handAnimation =
    holeCards.match(/@keyframes reveal-hole-card \{([\s\S]*?)\n {2}\}/)?.[1] ??
    "";
  const logoAnimation =
    logoCards.match(/@keyframes reveal-logo-card \{([\s\S]*?)\n {2}\}/)?.[1] ??
    "";
  assert.match(boardAnimation, /opacity: var\(--card-reveal-start-opacity\)/);
  assert.match(boardAnimation, /opacity: 1/);
  assert.match(boardAnimation, /translateY\(var\(--card-reveal-start-y\)\)/);
  assert.doesNotMatch(boardAnimation, /scale|rotate/);
  assert.match(handAnimation, /opacity: var\(--card-reveal-start-opacity\)/);
  assert.match(handAnimation, /translateY\(var\(--card-reveal-start-y\)\)/);
  assert.match(handAnimation, /rotate\(var\(--card-start-angle\)\)/);
  assert.match(handAnimation, /rotate\(var\(--card-end-angle\)\)/);
  assert.match(logoAnimation, /opacity: var\(--card-reveal-start-opacity\)/);
  assert.match(logoAnimation, /translateY\(var\(--card-reveal-start-y\)\)/);
  assert.match(logoAnimation, /rotate\(var\(--card-start-angle\)\)/);
  assert.match(logoAnimation, /rotate\(var\(--card-end-angle\)\)/);
  assert.match(
    quiz,
    /const choicesReady = \$derived\(revealedChoiceIndex === currentIndex\)/,
  );
  assert.match(quiz, /window\.setTimeout\([\s\S]*CHOICE_REVEAL_DELAY_MS/);
});

test("コンポーネント固有のスタイルをグローバルCSSに漏らさない", () => {
  for (const selector of [
    "app-shell",
    "landing-screen",
    "prepare-screen",
    "preparation-loading-screen",
    "game-screen",
    "board",
    "hand-cards",
    "logo-cards",
    "choice",
    "answer-sheet",
    "leave-dialog-layer",
    "quiz-progress-timer",
    "result-screen",
    "action-button",
    "playing-card",
    "quiz-example",
    "holdem-overview",
  ]) {
    assert.doesNotMatch(styles, new RegExp(`\\.${selector}\\b`));
  }

  for (const component of [
    app,
    landing,
    prepare,
    preparationLoading,
    quiz,
    result,
    actionButton,
    answerSheet,
    leaveConfirmationSheet,
    quizProgressTimer,
    board,
    holeCards,
    logoCards,
    card,
    choiceButton,
    landingQuizPreview,
    holdemOverview,
  ]) {
    assert.match(component, /<style>/);
  }
});

test("背景上で先読みし、完了後に準備画面をフェードインする", () => {
  assert.match(prepare, /問題を開始します/);
  assert.doesNotMatch(prepare, /準備できました/);
  assert.doesNotMatch(prepare, /問題を読み込んでいます|準備中…/);
  assert.match(prepare, /id="sound-toggle"/);
  assert.match(prepare, /aria-pressed=\{soundEnabled\}/);
  assert.match(prepare, /"音あり" : "音なし"/);
  assert.match(prepare, /id="start-quiz"/);
  assert.match(prepare, /disabled=\{!ready\}/);
  assert.match(
    prepare,
    /animation: prepare-screen-fade-in 200ms ease-out both;/,
  );
  assert.match(prepare, /\.prepare-controls \{[\s\S]*margin-top: auto;/);
  const soundIconRule =
    prepare.match(/\.sound-icon \{([\s\S]*?)\n {2}\}/)?.[1] ?? "";
  assert.match(soundIconRule, /linear-gradient/);
  assert.match(soundIconRule, /0 0\.3rem 0/);
  assert.match(soundIconRule, /border: 0;/);
  assert.doesNotMatch(soundIconRule, /var\(--accent\)|241 196 15/);
  assert.match(prepare, /M11 4\.702a\.705\.705/);
  assert.match(prepare, /M19\.364 18\.364a9 9/);
  assert.match(prepare, /<line x1="22" x2="16" y1="9" y2="15"/);
  assert.match(app, /function showPreparation\(\)/);
  assert.match(app, /type: "START_PREPARATION"/);
  assert.match(app, /flow = preparingFlow;/);
  assert.match(app, /<PreparationLoadingScreen/);
  assert.match(
    app,
    /<PreparationLoadingScreen delayMs=\{LOADING_INDICATOR_DELAY_MS\}/,
  );
  assert.match(app, /waitLoadingAnimation\(\(\) =>/);
  assert.match(
    app,
    /Promise\.all\(\[[\s\S]*selectSession\(\)[\s\S]*preloadGameFonts\(\)[\s\S]*preloadSoundEffects\(\)/,
  );
  assert.match(loadingTiming, /LOADING_INDICATOR_DELAY_MS = 350/);
  assert.match(loadingTiming, /LOADING_INDICATOR_MIN_VISIBLE_MS = 600/);
  assert.match(
    preparationLoading,
    /animation:[\s\S]*loading-spinner-appear[\s\S]*loading-spinner-rotate/,
  );
  assert.match(app, /<LandingScreen[\s\S]*onStart=\{showPreparation\}/);
  assert.match(app, /onStart=\{startSession\}/);
  assert.match(app, /playSound\("start"\)/);
  assert.match(app, /playSound\("warning"\)/);
  assert.match(app, /playSound\(correct \? "correct" : "wrong"\)/);
  assert.match(
    app,
    /playSound\(score === session\.length \? "perfect" : "complete"\)/,
  );
  assert.match(soundEffects, /decodeAudioData/);
  assert.match(soundEffects, /createBufferSource/);
  assert.match(soundEffects, /source\.start\(0\)/);
  assert.doesNotMatch(soundEffects, /new Audio\(/);

  for (const filename of [
    "kettei_33.mp3",
    "audiostock_106548.mp3",
    "kettei_2.mp3",
    "otologic-warning-siren05-03.mp3",
    "otologic-multi-accent04-1.mp3",
    "otologic-multi-accent03-2.mp3",
  ]) {
    assert.ok(
      fs.statSync(path.join(root, "public", "sounds", filename)).size > 0,
    );
  }
});

test("問題画面は回答パネルをコンポーネントで表示する", () => {
  assert.match(quiz, /<AnswerSheet/);
  assert.match(answerSheet, /@keyframes raise-sheet/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("右の手札の勝率問題は対象の手札枠を強調する", () => {
  assert.match(quiz, /targetHand=\{question\.targetHand\}/);
  assert.match(handComparison, /class:is-target=\{index === targetHand\}/);
  assert.match(
    handComparison,
    /\.hand-option\.is-target[\s\S]*border-color: var\(--accent-emphasis\)/,
  );
});

test("常設の戻る操作を置かず、回答パネルから終了確認を開く", () => {
  assert.doesNotMatch(quiz, /aria-label="トップへ戻る"/);
  assert.doesNotMatch(quiz, /class="icon-button"/);
  assert.match(answerSheet, /id="leave-quiz"/);
  assert.match(answerSheet, /aria-label="問題を終了する"/);
  assert.match(answerSheet, /M11 20H2/);
  assert.match(answerSheet, /M14 12h\.01/);
  assert.match(quiz, /import LeaveConfirmationSheet/);
  assert.match(quiz, /leaveConfirmationOpen/);
  assert.match(quiz, /blocked=\{leaveConfirmationOpen\}/);
  assert.match(answerSheet, /inert=\{blocked\}/);
  assert.match(leaveConfirmationSheet, /role="dialog"/);
  assert.ok(
    leaveConfirmationSheet.indexOf('id="confirm-leave"') <
      leaveConfirmationSheet.indexOf('id="continue-quiz"'),
  );
  assert.match(leaveConfirmationSheet, /label="トップページに戻る"/);
  assert.match(leaveConfirmationSheet, /label="問題を続ける"/);
  assert.match(leaveConfirmationSheet, /id="continue-quiz"/);
});

test("結果画面は正答数・回答時間・時間切れ数を表示し、全問正解を紙吹雪で祝う", () => {
  assert.match(app, /let sessionElapsedMs = \$state\(0\)/);
  assert.match(app, /let sessionTimeLimitMs = \$state\(0\)/);
  assert.match(
    app,
    /const question = session\[questionIndex\];[\s\S]*getQuestionTimeLimitMs\(question\)/,
  );
  assert.match(app, /elapsedMs=\{sessionElapsedMs\}/);
  assert.match(app, /outcome === "timeout"/);
  assert.match(app, /\{timeoutCount\}/);
  assert.match(result, /getResultSummary/);
  assert.match(result, /summary\.scoreLabel/);
  assert.match(result, /summary\.elapsedLabel/);
  assert.match(result, /summary\.limitLabel/);
  assert.match(result, /summary\.timeoutLabel/);
  assert.match(result, /\{#if summary\.timeoutLabel\}/);
  assert.match(result, /summary\.perfect/);
  assert.match(result, /class="confetti"/);
  assert.match(result, /@keyframes confetti-fall/);
  assert.match(resultSummary, /天才！君こそポーカーキングだ！/);
  assert.match(resultSummary, /惜しい！もう少し！/);
  assert.doesNotMatch(resultSummary, /判断は速い！/);
  assert.doesNotMatch(resultSummary, /鋭い！その速さなら/);
});

test("10問の進捗と残り時間を1つのセグメント表示へ統合する", () => {
  assert.match(quiz, /import QuizProgressTimer/);
  assert.match(quiz, /<QuizProgressTimer/);
  assert.doesNotMatch(quiz, /class="progress-track"/);
  assert.match(quizProgressTimer, /role="progressbar"/);
  assert.match(quizProgressTimer, /role="timer"/);
  assert.match(quizProgressTimer, /class:is-active=\{isActive\}/);
  assert.match(quizProgressTimer, /durationMs \/ 1_000/);
  assert.match(quizProgressTimer, /countdown\.elapsedProgress/);
  assert.doesNotMatch(quizProgressTimer, /class="timer-number/);
  assert.match(quizProgressTimer, /outcome === "correct"/);
  assert.match(
    quizProgressTimer,
    /outcome === "wrong" \|\| outcome === "timeout"/,
  );
  assert.match(quizProgressTimer, /class="screen-time-warning"/);
  assert.match(quizProgressTimer, /is-critical-screen/);
  assert.match(
    quizProgressTimer,
    /\.is-warning \.segment-fill \{[\s\S]*background: rgb\(255 255 255 \/ 94%\)/,
  );
  assert.match(quizProgressTimer, /rgb\(255 255 255 \/ 72%\)/);
  assert.match(
    questionTimer,
    /mode === "B" \|\| question\.difficulty === "hard"/,
  );
});

test("時間切れを一度だけ不正解として確定する", () => {
  assert.match(
    app,
    /function handleTimeout\(questionIndex(?:: number)?, elapsedMs(?:: number)?\)/,
  );
  assert.match(app, /type: "TIMEOUT"/);
  assert.match(gameFlow, /state\.status === "answering"/);
  assert.match(gameFlow, /state\.questionIndex === event\.questionIndex/);
  assert.match(gameFlow, /timedOut: true/);
  assert.match(app, /outcomes\[questionIndex\]/);
  assert.match(quiz, /onTimeout=\{handleQuestionTimeout\}/);
  assert.match(quiz, /timedOut=\{answerResult\.timedOut\}/);
  assert.match(answerSheet, /"時間切れ"/);
});
