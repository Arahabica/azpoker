import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const html = read("index.html");
const suitPreviewHtml = read("suit-mark-preview.html");
const app = read("src/App.svelte");
const landing = read("src/screens/LandingScreen.svelte");
const quiz = read("src/screens/QuizScreen.svelte");
const result = read("src/screens/ResultScreen.svelte");
const card = read("src/components/PlayingCard.svelte");
const suitPreview = read("src/SuitMarkPreview.svelte");
const cardSuits = read("src/components/card-suits.js");
const cardFace = read("src/components/card-faces/CardFace.svelte");
const styles = read("styles.css");
const viteConfig = read("vite.config.js");
const cardFontPath = path.join(
  root,
  "assets",
  "fonts",
  "arbutus-slab",
  "ArbutusSlab-Regular-latin.woff2",
);

test("Svelte + Viteのアプリと採用スート確認エントリを持つ", () => {
  assert.match(html, /<div id="app"><\/div>/);
  assert.match(html, /type="module" src="\/src\/main\.js"/);
  assert.match(
    suitPreviewHtml,
    /type="module" src="\/src\/suit-preview\.js"/,
  );
  assert.match(viteConfig, /svelte\(\)/);
  assert.match(viteConfig, /suit-mark-preview\.html/);
  assert.doesNotMatch(viteConfig, /cardPreview|card-balance-preview/);
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

test("問題画面はボードを上、傾けた手札を下に置く", () => {
  assert.ok(quiz.indexOf('class="board-lane"') < quiz.indexOf('class="hand-cards"'));
  assert.match(quiz, /id="hole-label" class="hand-label">手札<\/p>/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(card, /index === 0[\s\S]*"-6deg"[\s\S]*"6deg"/);
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
  assert.match(card, /import \{ SHARP_SUITS \}/);
  assert.match(card, /import CardFace/);
  assert.match(card, /suitSet = SHARP_SUITS/);
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

test("採用スートはシャープ1種類だけを持つ", () => {
  assert.match(cardSuits, /export const SHARP_SUITS/);
  assert.equal(
    cardSuits.match(/export const [A-Z_]+_SUITS/g)?.length,
    1,
    "スートセットを複数残さない",
  );
  assert.match(cardSuits, /const SHARP_PEDESTAL_PATH/);
  assert.equal(
    cardSuits.match(/\$\{SHARP_PEDESTAL_PATH\}/g)?.length,
    2,
    "スペードとクラブが同じ台座パスを使う",
  );
  assert.match(suitPreview, /import \{ SHARP_SUITS \}/);
  assert.match(suitPreview, /<h1>シャープ<\/h1>/);
  assert.match(suitPreview, /const suitCards = \["As", "Ah", "Ad", "Ac"\]/);
  assert.match(suitPreview, /suitSet=\{SHARP_SUITS\}/);
  assert.doesNotMatch(suitPreview, /candidate|groups|比較/);
});

test("本番用カード面コンポーネントだけを残す", () => {
  assert.match(landing, /PlayingCard/);
  assert.match(quiz, /PlayingCard/);
  assert.deepEqual(
    fs.readdirSync(path.join(root, "src", "components", "card-faces")),
    ["CardFace.svelte"],
  );
  assert.match(cardFace, /width: 19cqi/);
  assert.doesNotMatch(card, /faceComponent|FaceComponent/);
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
