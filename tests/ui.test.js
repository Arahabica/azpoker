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
const landing = read("src/screens/LandingScreen.svelte");
const quiz = read("src/screens/QuizScreen.svelte");
const result = read("src/screens/ResultScreen.svelte");
const card = read("src/components/PlayingCard.svelte");
const choiceButton = read("src/components/ChoiceButton.svelte");
const cardSuits = read("src/components/card-suits.js");
const cardFace = read("src/components/card-faces/CardFace.svelte");
const mixedFontText = read("src/components/MixedFontText.svelte");
const fontBuildScript = read("scripts/build_font_subsets.mjs");
const styles = read("styles.css");
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
  assert.match(html, /<div id="app"><\/div>/);
  assert.match(html, /type="module" src="\/src\/main\.js"/);
  assert.match(viteConfig, /svelte\(\)/);
  assert.match(viteConfig, /assetsInlineLimit: 0/);
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
    styles,
    /\.landing-screen \{\s*font-family: "Kosugi Maru Landing", sans-serif;/,
  );
  assert.match(
    styles,
    /\.game-screen,[\s\S]*\.error \{\s*font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;/,
  );
  assert.match(styles, /--card-rank-font: "Arbutus Slab", serif/);
  assert.doesNotMatch(styles, /fonts\.googleapis/);
  const landingRule = styles.match(/\.landing-screen \{([^}]*)\}/)?.[1] ?? "";
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
    /0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz%/,
  );
  assert.match(fontBuildScript, /LandingScreen\.svelte/);

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
  assert.match(styles, /\.actual-probability \{[\s\S]*font-weight: 400/);
  assert.match(styles, /\.score \{[\s\S]*font-weight: 400/);
});

test("問題画面はボードを上、傾けた手札を下に置く", () => {
  assert.ok(quiz.indexOf('class="board-lane"') < quiz.indexOf('class="hand-cards"'));
  assert.match(quiz, /id="hole-label" class="hand-label">手札<\/p>/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(card, /index === 0[\s\S]*"-6deg"[\s\S]*"6deg"/);
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

test("問題画面に説明用ラベルを増やさない", () => {
  const visibleUi = `${landing}\n${quiz}\n${result}`;
  for (const copy of [
    ">FLOP<",
    ">TURN<",
    ">ボード<",
    "あなたの手札",
    "表示された時点から",
    "5%刻みの2択",
  ]) {
    assert.doesNotMatch(visibleUi, new RegExp(copy));
  }
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
  assert.match(landing, /PlayingCard/);
  assert.match(quiz, /PlayingCard/);
  assert.deepEqual(
    fs.readdirSync(path.join(root, "src", "components", "card-faces")),
    ["CardFace.svelte"],
  );
  assert.match(cardFace, /width: 19cqi/);
});

test("480pxのモバイル領域とPCの左右余白を持つ", () => {
  assert.match(styles, /--app-max-width: 480px/);
  assert.match(styles, /max-width: var\(--app-max-width\)/);
  assert.match(styles, /@media \(min-width: 481px\)/);
  assert.match(styles, /margin: 0 auto/);
});

test("ターンの段階表示と回答パネルを持つ", () => {
  assert.match(app, /await wait\(reducedMotion \? 0 : 520\)/);
  assert.match(quiz, /data-phase=\{answerResult \? "answer" : "question"\}/);
  assert.match(quiz, /<AnswerSheet/);
  assert.match(styles, /@keyframes raise-sheet/);
  assert.match(styles, /prefers-reduced-motion/);
});
