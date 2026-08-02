import assert from "node:assert/strict";
import test from "node:test";

import {
  loadQuestionPool,
  resetQuestionLoaderForTest,
} from "../src/question-loader.js";

test("manifestを読み、A・B+C・Dの100問JSONだけを取得する", async () => {
  resetQuestionLoaderForTest();
  const urls = [];
  const fakeFetch = async (url) => {
    urls.push(url);
    if (url === "/questions/manifest.json") {
      return {
        ok: true,
        json: async () => ({
          version: "abc123",
          groups: {
            A: { files: 1, path: "a" },
            BC: { files: 1, path: "bc" },
            D: { files: 1, path: "d" },
          },
        }),
      };
    }
    const group = url.match(/\/questions\/(a|bc|d)\//)?.[1].toUpperCase();
    const questions = group === "A"
      ? Array.from({ length: 100 }, (_, index) => ({ id: `A-${index}`, mode: "A", category: `a-${index}` }))
      : group === "BC"
        ? [
            ...Array.from({ length: 50 }, (_, index) => ({ id: `BH-${index}`, mode: "B", answerType: "hand" })),
            ...Array.from({ length: 30 }, (_, index) => ({ id: `BP-${index}`, mode: "B", answerType: "percent" })),
            ...Array.from({ length: 20 }, (_, index) => ({ id: `C-${index}`, mode: "C" })),
          ]
        : Array.from({ length: 100 }, (_, index) => ({ id: `D-${index}`, mode: "D", category: `d-${index}` }));
    return {
      ok: true,
      json: async () => questions,
    };
  };
  const pool = await loadQuestionPool(() => 0, fakeFetch);
  assert.equal(pool.length, 300);
  assert.equal(urls.length, 4);
  assert.ok(urls.slice(1).every((url) => url.endsWith("0001.json?v=abc123")));

  const reused = await loadQuestionPool(() => 0, fakeFetch);
  assert.equal(reused.length, 300);
  assert.equal(urls.length, 4, "使用可能な3パックは再取得しない");

  await loadQuestionPool(() => 0, fakeFetch, "BC");
  assert.equal(urls.length, 5);
  assert.match(urls.at(-1), /\/questions\/bc\/0001\.json/);
});

test("JSON取得失敗をユーザー向けエラーへ変換する", async () => {
  resetQuestionLoaderForTest();
  await assert.rejects(
    loadQuestionPool(() => 0, async () => ({ ok: false })),
    /問題を読み込めませんでした/,
  );
});
