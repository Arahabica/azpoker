import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CARD_SUITS } from "../src/components/card-suits.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const html = read("index.html");
const app = read("src/App.svelte");
const main = read("src/main.ts");
const serverEntry = read("src/entry-server.ts");
const prerender = read("scripts/prerender.mjs");
const packageJson = JSON.parse(read("package.json"));
const landing = read("src/screens/LandingScreen.svelte");
const prepare = read("src/screens/PrepareScreen.svelte");
const preparationLoading = read("src/screens/PreparationLoadingScreen.svelte");
const quiz = read("src/screens/QuizScreen.svelte");
const result = read("src/screens/ResultScreen.svelte");
const actionButton = read("src/components/ActionButton.svelte");
const answerSheet = read("src/components/AnswerSheet.svelte");
const leaveConfirmationSheet = read(
  "src/components/LeaveConfirmationSheet.svelte",
);
const board = read("src/components/Board.svelte");
const card = read("src/components/PlayingCard.svelte");
const choiceButton = read("src/components/ChoiceButton.svelte");
const holeCards = read("src/components/HoleCards.svelte");
const logoCards = read("src/components/LogoCards.svelte");
const cardSuits = read("src/components/card-suits.ts");
const cardFace = read("src/components/card-faces/CardFace.svelte");
const mixedFontText = read("src/components/MixedFontText.svelte");
const quizProgressTimer = read("src/components/QuizProgressTimer.svelte");
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
    prepare,
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
    cardFace,
    choiceButton,
    mixedFontText,
  ]) {
    assert.match(component, /<script lang="ts">/);
  }
});

test("トップ画面をビルド時に描画し、ブラウザでhydrateする", () => {
  assert.match(serverEntry, /import \{ render \} from "svelte\/server"/);
  assert.match(serverEntry, /return render\(App\)/);
  assert.match(prerender, /import\(serverOutput\)/);
  assert.match(prerender, /\.replace\(outlet, body\)/);
  assert.match(prerender, /body\.includes\('id="landing"'\)/);
  assert.match(prerender, /rm\(serverOutputDirectory/);
  assert.match(main, /import \{ hydrate, mount \} from "svelte"/);
  assert.match(
    main,
    /target\.querySelector\("\.app-shell"\) \? hydrate : mount/,
  );
  assert.match(
    packageJson.scripts.build,
    /vite build --ssr src\/entry-server\.ts --outDir \.prerender/,
  );
  assert.match(packageJson.scripts.build, /node scripts\/prerender\.mjs/);
});

test("トップ・準備・問題・結果を独立したSvelteコンポーネントで切り替える", () => {
  assert.match(app, /view === "landing"/);
  assert.match(app, /view === "prepare"/);
  assert.match(app, /view === "game"/);
  assert.match(app, /<LandingScreen/);
  assert.match(app, /<PrepareScreen/);
  assert.match(app, /<QuizScreen/);
  assert.match(app, /<ResultScreen/);
  assert.match(landing, /id="start-game"/);
  assert.match(result, /id="back-home"/);
});

test("アクセントカラーに黄色を使う", () => {
  const rootBlock = styles.match(/:root \{([^}]*)\}/)?.[1] ?? "";
  assert.match(rootBlock, /--accent: rgb\(241 196 15\);/);
  assert.match(rootBlock, /--accent-emphasis: rgb\(241 196 15\);/);
});

test("UIフォントを自己配信し、初期トップ用Kosugiを別ファイルにする", () => {
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.doesNotMatch(html, /<link[^>]+rel="preconnect"/);
  const landingPreload =
    html.match(/<link[^>]+KosugiMaru-Landing\.woff2[^>]*>/)?.[0] ?? "";
  assert.match(landingPreload, /rel="preload"/);
  assert.match(landingPreload, /as="font"/);
  assert.match(landingPreload, /type="font\/woff2"/);
  assert.match(landingPreload, /crossorigin/);
  assert.match(
    styles,
    /font-family: "Kosugi Maru Landing"[\s\S]*KosugiMaru-Landing\.woff2/,
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
    /\.landing-screen \{[\s\S]*font-family: "Kosugi Maru Landing", sans-serif;/,
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
  const landingRule = landing.match(/\.landing-screen \{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(landingRule, /Kosugi Maru Game|M PLUS Rounded/);

  const landingFontSize = fs.statSync(landingFontPath).size;
  const gameFontSize = fs.statSync(gameFontPath).size;
  const mplusFontSize = fs.statSync(mplusFontPath).size;
  assert.ok(landingFontSize > 0 && landingFontSize < 3_000);
  assert.ok(gameFontSize > landingFontSize && gameFontSize < 60_000);
  assert.ok(mplusFontSize > 0 && mplusFontSize < 10_000);
  assert.match(fontBuildScript, /const landingText = "暗算ポーカーはじめる"/);
  assert.match(
    fontBuildScript,
    /0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\.%/,
  );
  assert.match(fontBuildScript, /LandingScreen\.svelte/);
  assert.match(fontBuildScript, /\(\?:ts\|svelte\)/);
  assert.match(landing, /\.brand-lockup h1 \{[\s\S]*line-height: 1;/);
  assert.match(logoCards, /\.logo-cards \{[\s\S]*height: 8\.5rem;/);

  assert.match(quiz, /MixedFontText text=\{question\.prompt\} phraseWrap/);
  assert.match(mixedFontText, /\[A-Za-z0-9%\]/);
  assert.match(mixedFontText, /splitAtNaturalBreaks/);
  assert.match(mixedFontText, /<wbr \/>/);
  assert.match(mixedFontText, /<\/span>\{#if phraseWrap/);
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
  assert.match(app, /type View = [^;]*"preparing"/);
  assert.match(app, /view = "preparing";/);
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
  assert.match(app, /<LandingScreen onStart=\{showPreparation\}/);
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

test("常設の戻る操作を置かず、回答パネルから終了確認を開く", () => {
  assert.doesNotMatch(quiz, /aria-label="トップへ戻る"/);
  assert.doesNotMatch(quiz, /class="icon-button"/);
  assert.match(answerSheet, /id="leave-quiz"/);
  assert.match(answerSheet, /aria-label="問題を終了する"/);
  assert.match(answerSheet, /m11 5 4 1\.5v11L11 19Z/);
  assert.match(answerSheet, /M13\.5 12H21/);
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
    /const question = currentQuestion;[\s\S]*getQuestionTimeLimitMs\(question\)/,
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
  assert.match(app, /questionIndex !== currentIndex/);
  assert.match(app, /timedOut: true/);
  assert.match(app, /outcomes\[currentIndex\]/);
  assert.match(quiz, /onTimeout=\{handleQuestionTimeout\}/);
  assert.match(quiz, /timedOut=\{answerResult\.timedOut\}/);
  assert.match(answerSheet, /"時間切れ"/);
});
