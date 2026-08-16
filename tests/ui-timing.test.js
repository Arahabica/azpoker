import assert from "node:assert/strict";
import test from "node:test";

import {
  PERFECT_RESULT_REVEAL_DELAY_MS,
  PERFECT_SPOTLIGHT_DELAY_MS,
} from "../src/ui-timing.ts";

test("全問正解は1秒後にスポットライト、2.3秒後に結果を表示する", () => {
  assert.equal(PERFECT_SPOTLIGHT_DELAY_MS, 1_000);
  assert.equal(PERFECT_RESULT_REVEAL_DELAY_MS, 2_300);
});
