import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import ResultScreen from "./ResultScreen.svelte";

const meta = {
  title: "画面/ゲーム終了",
  component: ResultScreen,
  args: {
    score: 10,
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
    elapsedMs: 80_000,
  },
};
