import assert from "node:assert/strict";
import test from "node:test";

import {
  loadQuestionPool,
  resetQuestionLoaderForTest,
} from "../src/question-loader.js";

test("manifestを読み、各モードの100問JSONだけを取得する", async () => {
  resetQuestionLoaderForTest();
  const urls = [];
  const fakeFetch = async (url) => {
    urls.push(url);
    if (url === "/questions/manifest.json") {
      return {
        ok: true,
        json: async () => ({
          version: "abc123",
          modes: Object.fromEntries(["A", "B", "C", "D"].map((mode) => [mode, { files: 1 }])),
        }),
      };
    }
    const mode = url.match(/\/questions\/([a-d])\//)?.[1].toUpperCase();
    return {
      ok: true,
      json: async () => Array.from({ length: 100 }, (_, index) => ({ id: `${mode}-${index}`, mode })),
    };
  };
  const pool = await loadQuestionPool(() => 0, fakeFetch);
  assert.equal(pool.length, 400);
  assert.equal(urls.length, 5);
  assert.ok(urls.slice(1).every((url) => url.endsWith("0001.json?v=abc123")));
});

test("JSON取得失敗をユーザー向けエラーへ変換する", async () => {
  resetQuestionLoaderForTest();
  await assert.rejects(
    loadQuestionPool(() => 0, async () => ({ ok: false })),
    /問題を読み込めませんでした/,
  );
});
