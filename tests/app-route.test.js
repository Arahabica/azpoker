import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_PATHS,
  getPageMetadata,
  normalizeAppPath,
} from "../src/app-route.ts";

test("公開する4つのURLを末尾スラッシュの有無によらず解決する", () => {
  assert.deepEqual(APP_PATHS, ["/", "/history", "/terms", "/credits"]);
  assert.equal(normalizeAppPath("/history"), "/history");
  assert.equal(normalizeAppPath("/history/"), "/history");
  assert.equal(normalizeAppPath("/terms?from=footer"), "/terms");
  assert.equal(normalizeAppPath("/credits#sounds"), "/credits");
});

test("未定義のURLはゲームを開始せずトップへ戻す", () => {
  assert.equal(normalizeAppPath("/unknown"), "/");
  assert.equal(normalizeAppPath(""), "/");
});

test("各ページに固有のタイトルと説明を持たせる", () => {
  for (const path of APP_PATHS) {
    const metadata = getPageMetadata(path);
    assert.match(metadata.title, /暗算ポーカー/);
    assert.ok(metadata.description.length > 0);
  }
  assert.match(getPageMetadata("/history").title, /^履歴/);
  assert.match(getPageMetadata("/terms").title, /^利用規約/);
});
