import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CARD_SUITS } from "../src/components/card-suits.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const html = read("index.html");
const app = read("src/App.svelte");
const main = read("src/main.js");
const serverEntry = read("src/entry-server.js");
const prerender = read("scripts/prerender.mjs");
const packageJson = JSON.parse(read("package.json"));
const landing = read("src/screens/LandingScreen.svelte");
const quiz = read("src/screens/QuizScreen.svelte");
const result = read("src/screens/ResultScreen.svelte");
const actionButton = read("src/components/ActionButton.svelte");
const answerSheet = read("src/components/AnswerSheet.svelte");
const board = read("src/components/Board.svelte");
const card = read("src/components/PlayingCard.svelte");
const choiceButton = read("src/components/ChoiceButton.svelte");
const holeCards = read("src/components/HoleCards.svelte");
const logoCards = read("src/components/LogoCards.svelte");
const cardSuits = read("src/components/card-suits.js");
const cardFace = read("src/components/card-faces/CardFace.svelte");
const mixedFontText = read("src/components/MixedFontText.svelte");
const fontBuildScript = read("scripts/build_font_subsets.mjs");
const styles = read("styles.css");
const uiTiming = read("src/ui-timing.js");
const viteConfig = read("vite.config.js");
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
  assert.match(html, /type="module" src="\/src\/main\.js"/);
  assert.match(viteConfig, /svelte\(\)/);
  assert.match(viteConfig, /assetsInlineLimit: 0/);
});

test("トップ画面をビルド時に描画し、ブラウザでhydrateする", () => {
  assert.match(serverEntry, /import \{ render \} from "svelte\/server"/);
  assert.match(serverEntry, /return render\(App\)/);
  assert.match(prerender, /import\(serverOutput\)/);
  assert.match(prerender, /\.replace\(outlet, body\)/);
  assert.match(prerender, /body\.includes\('id="landing"'\)/);
  assert.match(prerender, /rm\(serverOutputDirectory/);
  assert.match(main, /import \{ hydrate, mount \} from "svelte"/);
  assert.match(main, /target\.querySelector\("\.app-shell"\) \? hydrate : mount/);
  assert.match(
    packageJson.scripts.build,
    /vite build --ssr src\/entry-server\.js --outDir \.prerender/,
  );
  assert.match(packageJson.scripts.build, /node scripts\/prerender\.mjs/);
});

test("トップ・問題・結果を独立したSvelteコンポーネントで切り替える", () => {
  assert.match(app, /view === "landing"/);
  assert.match(app, /view === "game"/);
  assert.match(app, /<LandingScreen/);
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
    quiz,
    /\.game-screen \{[\s\S]*font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;/,
  );
  assert.match(result, /\.result-screen \{[\s\S]*font-family: "M PLUS Rounded 1c UI"/);
  assert.match(app, /\.error \{[\s\S]*font-family: "M PLUS Rounded 1c UI"/);
  assert.match(styles, /--card-rank-font: "Arbutus Slab", serif/);
  assert.doesNotMatch(styles, /fonts\.googleapis/);
  const landingRule = landing.match(/\.landing-screen \{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(landingRule, /Kosugi Maru Game|M PLUS Rounded/);

  const landingFontSize = fs.statSync(landingFontPath).size;
  const gameFontSize = fs.statSync(gameFontPath).size;
  const mplusFontSize = fs.statSync(mplusFontPath).size;
  assert.ok(landingFontSize > 0 && landingFontSize < 3_000);
  assert.ok(gameFontSize > landingFontSize && gameFontSize < 50_000);
  assert.ok(mplusFontSize > 0 && mplusFontSize < 10_000);
  assert.match(fontBuildScript, /const landingText = "暗算ポーカーはじめる"/);
  assert.match(
    fontBuildScript,
    /0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\.%/,
  );
  assert.match(fontBuildScript, /LandingScreen\.svelte/);
  assert.match(landing, /\.brand-lockup h1 \{[\s\S]*line-height: 1;/);
  assert.match(logoCards, /\.logo-cards \{[\s\S]*height: 8\.5rem;/);

  assert.match(quiz, /MixedFontText text=\{question\.prompt\}/);
  assert.match(mixedFontText, /\[A-Za-z0-9%\]/);
  assert.match(
    mixedFontText,
    /<span class="mixed-font-text">[\s\S]*\{#each parts/,
  );
  assert.match(mixedFontText, /\.mixed-font-text \{[\s\S]*display: inline/);
  assert.match(
    mixedFontText,
    /\.mplus \{[\s\S]*font-family: "M PLUS Rounded 1c UI"[\s\S]*font-weight: 400/,
  );
  assert.match(choiceButton, /\.choice-value \{[\s\S]*font-weight: 400/);
  assert.match(answerSheet, /\.actual-probability \{[\s\S]*font-weight: 400/);
  assert.match(result, /\.score \{[\s\S]*font-weight: 400/);
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
  assert.match(card, /let \{ card, decorative = false \} = \$props\(\)/);
  assert.match(card, /role=\{decorative \? undefined : "img"\}/);
  assert.match(card, /aria-label=\{decorative \? undefined : details\.ariaLabel\}/);
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
  assert.match(quiz, /<Board cards=\{question\.board\} revealKey=\{currentIndex\}/);
  assert.doesNotMatch(app, /visibleBoard|boardCards|REVEAL_DELAY_MS/);
  assert.match(uiTiming, /CHOICE_REVEAL_DELAY_MS = 300/);
  assert.doesNotMatch(board, /REVEAL_DELAY_MS|animation-delay/);
  assert.doesNotMatch(`${card}\n${holeCards}\n${logoCards}`, /animation-delay|--deal-index|42ms|240ms/);
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
    board.match(/@keyframes reveal-board-card \{([\s\S]*?)\n  \}/)?.[1] ?? "";
  const handAnimation =
    holeCards.match(/@keyframes reveal-hole-card \{([\s\S]*?)\n  \}/)?.[1] ?? "";
  const logoAnimation =
    logoCards.match(/@keyframes reveal-logo-card \{([\s\S]*?)\n  \}/)?.[1] ?? "";
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
    "game-screen",
    "board",
    "hand-cards",
    "logo-cards",
    "choice",
    "answer-sheet",
    "result-screen",
    "action-button",
    "playing-card",
  ]) {
    assert.doesNotMatch(styles, new RegExp(`\\.${selector}\\b`));
  }

  for (const component of [
    app,
    landing,
    quiz,
    result,
    actionButton,
    answerSheet,
    board,
    holeCards,
    logoCards,
    card,
    choiceButton,
  ]) {
    assert.match(component, /<style>/);
  }
});

test("問題画面は回答パネルをコンポーネントで表示する", () => {
  assert.match(quiz, /<AnswerSheet/);
  assert.match(answerSheet, /@keyframes raise-sheet/);
  assert.match(styles, /prefers-reduced-motion/);
});
