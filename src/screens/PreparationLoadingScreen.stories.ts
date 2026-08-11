import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect } from "storybook/test";

import PreparationLoadingScreen from "./PreparationLoadingScreen.svelte";

const meta = {
  title: "画面/問題読み込み",
  component: PreparationLoadingScreen,
  args: {
    delayMs: 0,
  },
} satisfies Meta<typeof PreparationLoadingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpinnerVisible: Story = {
  name: "インジケーター表示",
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveAccessibleName(
      "問題を読み込んでいます",
    );
  },
};

export const ProductionDelay: Story = {
  name: "本番と同じ350ms遅延",
  args: { delayMs: 350 },
};

export const MinimumWidth: Story = {
  name: "最小幅280px",
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};
