"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("UIが参照する要素はHTMLにすべて存在する", () => {
  const queriedIds = [
    ...app.matchAll(/document\.querySelector\("#([^"]+)"\)/g),
  ].map((match) => match[1]);
  const htmlIds = new Set(
    [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]),
  );

  for (const id of queriedIds) {
    assert.ok(htmlIds.has(id), `不足している要素: #${id}`);
  }
});

test("トップ・問題・結果を別の画面状態として持つ", () => {
  for (const id of ["landing", "game", "result", "start-game", "back-home"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  assert.match(html, /id="game"[^>]*hidden/);
  assert.match(html, /id="result"[^>]*hidden/);
  assert.match(app, /showView\("landing"\)/);
  assert.match(app, /showView\("game"\)/);
  assert.match(app, /showView\("result"\)/);
  assert.match(app, /elements\.start\.addEventListener\("click", startSession\)/);
  assert.match(app, /showLanding\(false\);/);
});

test("問題画面はボードを上、傾けた手札を下に置く", () => {
  assert.ok(html.indexOf('id="board-cards"') < html.indexOf('id="hole-cards"'));
  assert.match(html, /id="hole-label" class="hand-label">手札<\/p>/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(app, /index === 0 \? "-6deg" : "6deg"/);
});

test("問題画面から説明用ラベルを除く", () => {
  for (const visibleCopy of [
    ">FLOP<",
    ">TURN<",
    ">ボード<",
    "あなたの手札",
    "表示された時点から",
    "5%刻みの2択",
  ]) {
    assert.doesNotMatch(html, new RegExp(visibleCopy));
  }

  assert.doesNotMatch(html, /id="stage"/);
  assert.doesNotMatch(html, /id="deal-status"/);
  assert.doesNotMatch(app, /stageLabel\(/);
});

test("カードはSVGスートと10表記に対応する", () => {
  assert.match(app, /SUIT_PATHS/);
  assert.match(app, /createElementNS\(SVG_NS, "svg"\)/);
  assert.match(app, /rank\.textContent = details\.rank/);
  assert.match(styles, /\.playing-card\[data-tone="red"\]/);
  assert.match(styles, /\.playing-card--board\[data-rank="10"\]/);
});

test("480pxのモバイル領域とPCの左右余白を持つ", () => {
  assert.match(styles, /--app-max-width: 480px/);
  assert.match(styles, /max-width: var\(--app-max-width\)/);
  assert.match(styles, /@media \(min-width: 481px\)/);
  assert.match(styles, /margin: 0 auto/);
});

test("ターンの段階表示と回答パネルを持つ", () => {
  assert.match(app, /await wait\(reducedMotion \? 0 : 520\)/);
  assert.match(app, /elements\.game\.dataset\.phase = "answer"/);
  assert.match(html, /id="feedback"[^>]*class="answer-sheet"/);
  assert.match(styles, /@keyframes raise-sheet/);
  assert.match(styles, /prefers-reduced-motion/);
});
