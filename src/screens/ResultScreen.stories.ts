import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import ResultScreen from "./ResultScreen.svelte";

const meta = {
  title: "画面/ゲーム終了",
  component: ResultScreen,
  args: {
    score: 6,
    total: 10,
    elapsedMs: 62_000,
    timeLimitMs: 95_000,
    timeoutCount: 0,
    onRetry: fn(),
    onHome: fn(),
  },
} satisfies Meta<typeof ResultScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FastPerfect: Story = {
  name: "全問正解・速い",
  args: {
    score: 10,
    elapsedMs: 30_000,
  },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector(".stat-value")).toHaveTextContent(
      /全問正解/,
    );
    await expect(
      canvasElement.querySelector(".stat-caption"),
    ).toHaveTextContent(/10\s*問中/);
    await expect(canvas.getAllByRole("button")).toHaveLength(2);
  },
};

export const Perfect: Story = {
  name: "全問正解",
  args: {
    score: 10,
    elapsedMs: 80_000,
  },
};

export const FastNine: Story = {
  name: "9問正解・速い",
  args: {
    score: 9,
    elapsedMs: 30_000,
  },
};

export const Nine: Story = {
  name: "9問正解",
  args: {
    score: 9,
    elapsedMs: 80_000,
  },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};

export const Eight: Story = {
  name: "8問正解",
  args: { score: 8 },
};

export const Six: Story = {
  name: "6問正解",
  play: async ({ canvas, canvasElement }) => {
    const statValues = canvasElement.querySelectorAll(".stat-value");
    await expect(statValues[0]).toHaveTextContent(/6\s*問正解/);
    await expect(statValues[1]).toHaveTextContent(/62\.0\s*秒/);
    await expect(canvas.getAllByRole("button")).toHaveLength(2);
  },
};

export const Four: Story = {
  name: "4問正解",
  args: { score: 4 },
};

export const LowWithTimeout: Story = {
  name: "低スコア・時間切れあり",
  args: {
    score: 2,
    timeoutCount: 2,
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector(".timeout-count"),
    ).toHaveTextContent(/時間切れ:\s*2\s*問/);
  },
};
