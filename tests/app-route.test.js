import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_PATHS,
  OGP_IMAGE_URL,
  SITE_ORIGIN,
  createHistoryDetailPath,
  createHistoryDetailState,
  getCanonicalUrl,
  getHistoryDetailNavigation,
  getHistoryIdFromPath,
  getPageMetadata,
  isHistoryDetailPath,
  normalizeAppPath,
  readHistoryDetailOrigin,
} from "../src/app-route.ts";

test("公開する4つのURLを末尾スラッシュの有無によらず解決する", () => {
  assert.deepEqual(APP_PATHS, ["/", "/history", "/terms", "/credits"]);
  assert.equal(normalizeAppPath("/history"), "/history");
  assert.equal(normalizeAppPath("/history/"), "/history");
  assert.equal(normalizeAppPath("/terms?from=footer"), "/terms");
  assert.equal(normalizeAppPath("/credits#sounds"), "/credits");
});

test("履歴IDごとに詳細URLを作り、URLから元のIDを復元する", () => {
  const path = createHistoryDetailPath("result 1/日本語");
  assert.equal(path, "/history/result%201%2F%E6%97%A5%E6%9C%AC%E8%AA%9E");
  assert.equal(getHistoryIdFromPath(path), "result 1/日本語");
  assert.equal(normalizeAppPath(`${path}/?from=test`), path);
  assert.equal(isHistoryDetailPath(path), true);
  assert.throws(() => createHistoryDetailPath(""), /履歴ID/);
});

test("履歴詳細の遷移元ごとに上部の戻り先を1つだけ決める", () => {
  const topState = createHistoryDetailState("top");
  const historyState = createHistoryDetailState("history");

  assert.equal(readHistoryDetailOrigin(topState), "top");
  assert.equal(readHistoryDetailOrigin(historyState), "history");
  assert.equal(readHistoryDetailOrigin(null), "direct");
  assert.equal(
    readHistoryDetailOrigin({ anzanPokerHistoryOrigin: "other" }),
    "direct",
  );
  assert.deepEqual(getHistoryDetailNavigation("top"), {
    path: "/",
    label: "トップへ",
    ariaLabel: "トップページへ戻る",
  });
  assert.deepEqual(getHistoryDetailNavigation("history"), {
    path: "/history",
    label: "履歴一覧へ戻る",
    ariaLabel: "履歴一覧へ戻る",
  });
  assert.deepEqual(
    getHistoryDetailNavigation("direct"),
    getHistoryDetailNavigation("history"),
  );
});

test("未定義のURLはゲームを開始せずトップへ戻す", () => {
  assert.equal(normalizeAppPath("/unknown"), "/");
  assert.equal(normalizeAppPath("/history/"), "/history");
  assert.equal(normalizeAppPath("/history/result-1/extra"), "/");
  assert.equal(normalizeAppPath("/history/%"), "/");
  assert.equal(normalizeAppPath(""), "/");
});

test("各ページに固有のタイトルと説明を持たせる", () => {
  for (const path of APP_PATHS) {
    const metadata = getPageMetadata(path);
    assert.match(metadata.title, /暗算ポーカー/);
    assert.ok(metadata.description.length > 0);
  }
  assert.match(getPageMetadata("/history").title, /^履歴/);
  assert.match(getPageMetadata("/history/result-1").title, /^履歴詳細/);
  assert.match(getPageMetadata("/terms").title, /^利用規約/);
});

test("公開URLとOGP画像はazpoker.meの絶対URLに統一する", () => {
  assert.equal(SITE_ORIGIN, "https://azpoker.me");
  assert.equal(getCanonicalUrl("/"), "https://azpoker.me/");
  assert.equal(getCanonicalUrl("/history"), "https://azpoker.me/history");
  assert.equal(
    getCanonicalUrl("/history/result-1"),
    "https://azpoker.me/history/result-1",
  );
  assert.equal(OGP_IMAGE_URL, "https://azpoker.me/ogp.png");
});
