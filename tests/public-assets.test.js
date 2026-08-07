import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("2枚のトランプカードをfaviconとして配信する", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const favicon = fs.readFileSync(
    path.join(root, "public", "favicon.svg"),
    "utf8",
  );

  assert.match(
    html,
    /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" \/>/,
  );
  assert.match(favicon, /<svg[^>]+viewBox="0 0 64 64"/);
  assert.equal((favicon.match(/<rect/g) ?? []).length, 3);
});

test("OGP画像を1200×630pxで配信する", () => {
  const image = fs.readFileSync(path.join(root, "public", "ogp.png"));
  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test("検索エンジンへ正規ドメインの公開ページを案内する", () => {
  const robots = fs.readFileSync(
    path.join(root, "public", "robots.txt"),
    "utf8",
  );
  const sitemap = fs.readFileSync(
    path.join(root, "public", "sitemap.xml"),
    "utf8",
  );

  assert.match(robots, /Sitemap: https:\/\/azpoker\.me\/sitemap\.xml/);
  for (const pathname of ["/", "/history", "/terms", "/credits"]) {
    assert.match(sitemap, new RegExp(`<loc>https://azpoker\\.me${pathname}`));
  }
});
