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

function assetSize(relativePath) {
  return fs.statSync(path.join(root, relativePath)).size;
}

const html = read("index.html");
const packageJson = JSON.parse(read("package.json"));
const tsconfig = read("tsconfig.json");
const viteConfig = read("vite.config.ts");
const app = read("src/App.svelte");
const main = read("src/main.ts");
const serverEntry = read("src/entry-server.ts");
const prerender = read("scripts/prerender.mjs");
const styles = read("styles.css");

test("Svelte・TypeScript・Viteの検査構成を維持する", () => {
  assert.match(html, /<div id="app"><!--app-html--><\/div>/);
  assert.match(html, /type="module" src="\/src\/main\.ts"/);
  assert.match(viteConfig, /svelte\(\)/);
  assert.match(viteConfig, /assetsInlineLimit: 0/);

  assert.match(
    packageJson.devDependencies["@typescript/native"],
    /^npm:typescript@\^7\./,
  );
  assert.match(
    packageJson.devDependencies.typescript,
    /^npm:@typescript\/typescript6@/,
  );
  assert.match(packageJson.scripts.typecheck, /typecheck:ts.*typecheck:svelte/);
  assert.match(packageJson.scripts.check, /pnpm run typecheck/);
  assert.match(packageJson.scripts.check, /pnpm run storybook:build/);
  assert.match(tsconfig, /"strict": true/);
  assert.match(tsconfig, /"noUncheckedIndexedAccess": true/);
});

test("公開ページをビルド時に描画し、ブラウザでhydrateする", () => {
  assert.match(serverEntry, /import \{ render \} from "svelte\/server"/);
  assert.match(serverEntry, /return render\(App, \{/);
  assert.match(serverEntry, /initialPath: normalizeAppPath\(pathname\)/);

  for (const outputPath of [
    "history/index.html",
    "history-detail/index.html",
    "terms/index.html",
    "credits/index.html",
  ]) {
    assert.match(prerender, new RegExp(outputPath.replace(".", "\\.")));
  }

  assert.match(
    prerender,
    /replace\(headOutlet, head\)\.replace\(outlet, body\)/,
  );
  assert.match(prerender, /rm\(serverOutputDirectory/);
  assert.match(main, /import \{ hydrate, mount \} from "svelte"/);
  assert.match(main, /const shouldHydrate = serverPath === initialPath/);
  assert.match(main, /props: \{ initialPath \}/);
  assert.match(
    packageJson.scripts.build,
    /vite build --ssr src\/entry-server\.ts --outDir \.prerender/,
  );
  assert.match(packageJson.scripts.build, /node scripts\/prerender\.mjs/);
});

test("AppがURLとゲーム状態を対応する画面へ接続する", () => {
  for (const screen of [
    "LandingScreen",
    "PreparationLoadingScreen",
    "PrepareScreen",
    "QuizScreen",
    "ResultScreen",
    "HistoryScreen",
    "TermsScreen",
    "CreditsScreen",
  ]) {
    assert.match(app, new RegExp(`<${screen}\\b`));
  }

  for (const status of [
    "top",
    "preparing",
    "ready",
    "preparation-error",
    "answering",
    "answered",
    "result",
  ]) {
    assert.match(app, new RegExp(`flow\\.status === "${status}"`));
  }

  assert.match(app, /createInitialGameFlow\(\)/);
  assert.match(app, /transitionGameFlow\(flow,/);
  assert.match(app, /createHistoryDetailPath\(id\)/);
  assert.match(app, /openHistoryDetail\(id, "top"\)/);
  assert.match(app, /openHistoryDetail\(id, "history"\)/);
});

test("復習終了後は専用ページを挟まず通常結果へ戻す", () => {
  assert.doesNotMatch(app, /ReviewResultScreen|reviewCompletionMessage/);
  assert.match(app, /sessionElapsedMs = completedHistoryEntry\.elapsedMs/);
  assert.match(app, /sessionTimeLimitMs = completedHistoryEntry\.timeLimitMs/);
  assert.match(app, /sessionKind = "quiz"/);
});

test("問題・フォント・効果音を読み込んでからゲームを開始する", () => {
  assert.match(app, /type: "START_PREPARATION"/);
  assert.match(app, /<PreparationLoadingScreen/);
  assert.match(app, /waitLoadingAnimation\(\(\) =>/);
  assert.match(
    app,
    /Promise\.all\(\[[\s\S]*selectSession\(\)[\s\S]*preloadGameFonts\(\)[\s\S]*preloadSoundEffects\(\)/,
  );
  assert.match(app, /onStart=\{startSession\}/);
  assert.match(app, /playSound\("start"\)/);
  assert.match(app, /playSound\("warning"\)/);
  assert.match(app, /playSound\(correct \? "correct" : "wrong"\)/);

  for (const filename of [
    "kettei_33.mp3",
    "audiostock_106548.mp3",
    "kettei_2.mp3",
    "otologic-warning-siren05-03.mp3",
    "otologic-multi-accent04-1.mp3",
    "otologic-multi-accent03-2.mp3",
  ]) {
    assert.ok(assetSize(`public/sounds/${filename}`) > 0);
  }
});

test("UIフォントを外部通信なしで配信する", () => {
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.doesNotMatch(html, /<link[^>]+rel="preconnect"/);

  const landingPreload =
    html.match(/<link[^>]+KosugiMaru-Landing\.woff2[^>]*>/)?.[0] ?? "";
  assert.match(landingPreload, /rel="preload"/);
  assert.match(landingPreload, /as="font"/);
  assert.match(landingPreload, /type="font\/woff2"/);
  assert.match(landingPreload, /crossorigin/);

  for (const font of [
    "Arbutus Slab",
    "Kosugi Maru Landing",
    "Kosugi Maru Landing Body",
    "Kosugi Maru Game",
    "M PLUS Rounded 1c UI",
  ]) {
    assert.match(styles, new RegExp(`font-family: "${font}"`));
  }

  const fontSizes = {
    card: assetSize(
      "assets/fonts/arbutus-slab/ArbutusSlab-Regular-latin.woff2",
    ),
    landing: assetSize("assets/fonts/kosugi-maru/KosugiMaru-Landing.woff2"),
    landingBody: assetSize(
      "assets/fonts/kosugi-maru/KosugiMaru-LandingBody.woff2",
    ),
    game: assetSize("assets/fonts/kosugi-maru/KosugiMaru-Game.woff2"),
    ui: assetSize("assets/fonts/m-plus-rounded-1c/MPLUSRounded1c-UI.woff2"),
  };

  assert.ok(fontSizes.card > 0);
  assert.ok(fontSizes.landing > 0 && fontSizes.landing < 12_000);
  assert.ok(
    fontSizes.landingBody > fontSizes.landing && fontSizes.landingBody < 35_000,
  );
  assert.ok(fontSizes.game > fontSizes.landingBody && fontSizes.game < 60_000);
  assert.ok(fontSizes.ui > 0 && fontSizes.ui < 10_000);
});

test("カード表示を共通コンポーネントへ集約する", () => {
  const playingCard = read("src/components/PlayingCard.svelte");
  const board = read("src/components/Board.svelte");
  const holeCards = read("src/components/HoleCards.svelte");
  const logoCards = read("src/components/LogoCards.svelte");
  const cardFace = read("src/components/card-faces/CardFace.svelte");

  assert.deepEqual(Object.keys(CARD_SUITS), ["h", "d", "s", "c"]);
  assert.match(board, /<PlayingCard/);
  assert.match(holeCards, /<PlayingCard/);
  assert.match(logoCards, /<PlayingCard/);
  assert.match(playingCard, /<CardFace/);
  assert.match(playingCard, /decorative = false/);
  assert.doesNotMatch(playingCard, /variant|CARD_ANGLES|animation:/);
  assert.match(cardFace, /\{rank\}/);
  assert.deepEqual(
    fs.readdirSync(path.join(root, "src", "components", "card-faces")),
    ["CardFace.svelte"],
  );
});

test("レスポンシブ境界とグローバルCSSの責務を固定する", () => {
  assert.match(styles, /--accent: rgb\(241 196 15\)/);
  assert.match(styles, /html \{[\s\S]*?min-width: 280px/);
  assert.match(styles, /body \{[\s\S]*?min-width: 280px/);
  assert.doesNotMatch(styles, /min-width: 320px/);
  assert.match(styles, /--app-max-width: 480px/);
  assert.match(app, /max-width: var\(--app-max-width\)/);
  assert.match(app, /@media \(min-width: 481px\)/);
  assert.match(app, /margin: 0 auto/);

  for (const selector of [
    "landing-screen",
    "prepare-screen",
    "preparation-loading-screen",
    "game-screen",
    "board",
    "hand-cards",
    "choice",
    "answer-sheet",
    "result-screen",
    "playing-card",
    "public-page",
  ]) {
    assert.doesNotMatch(styles, new RegExp(`\\.${selector}\\b`));
  }

  for (const component of [
    "src/screens/LandingScreen.svelte",
    "src/screens/PreparationLoadingScreen.svelte",
    "src/screens/PrepareScreen.svelte",
    "src/screens/QuizScreen.svelte",
    "src/screens/ResultScreen.svelte",
    "src/components/Board.svelte",
    "src/components/HoleCards.svelte",
    "src/components/PlayingCard.svelte",
    "src/components/PublicPageShell.svelte",
  ]) {
    assert.match(read(component), /<style>/);
  }
});
