import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import { REVIEW_COMPLETION_MESSAGES } from "../review.ts";
import ReviewResultScreen from "./ReviewResultScreen.svelte";

const meta = {
  title: "画面/復習完了",
  component: ReviewResultScreen,
  args: {
    message: REVIEW_COMPLETION_MESSAGES[0],
    onContinue: fn(),
    onHome: fn(),
  },
} satisfies Meta<typeof ReviewResultScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pattern01: Story = {
  name: "01 復習お疲れ様でした",
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "問題を続ける" }));
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
  },
};

export const Pattern02: Story = {
  name: "02 また一歩強くなりました",
  args: { message: REVIEW_COMPLETION_MESSAGES[1] },
};

export const Pattern03: Story = {
  name: "03 間違いを力に変えました",
  args: { message: REVIEW_COMPLETION_MESSAGES[2] },
};

export const Pattern04: Story = {
  name: "04 苦手な問題を克服",
  args: { message: REVIEW_COMPLETION_MESSAGES[3] },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};

export const Pattern05: Story = {
  name: "05 いい復習でした",
  args: { message: REVIEW_COMPLETION_MESSAGES[4] },
};

export const Pattern06: Story = {
  name: "06 すべて正解",
  args: { message: REVIEW_COMPLETION_MESSAGES[5] },
};

export const Pattern07: Story = {
  name: "07 向き合った分だけ強く",
  args: { message: REVIEW_COMPLETION_MESSAGES[6] },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};

export const Pattern08: Story = {
  name: "08 間違いに向き合えました",
  args: { message: REVIEW_COMPLETION_MESSAGES[7] },
};

export const Pattern09: Story = {
  name: "09 次の問題へ進もう",
  args: { message: REVIEW_COMPLETION_MESSAGES[8] },
};

export const Pattern10: Story = {
  name: "10 すべて解き直せました",
  args: { message: REVIEW_COMPLETION_MESSAGES[9] },
};

export const Pattern11: Story = {
  name: "11 復習で前進しました",
  args: { message: REVIEW_COMPLETION_MESSAGES[10] },
};

export const Pattern12: Story = {
  name: "12 もう大丈夫",
  args: { message: REVIEW_COMPLETION_MESSAGES[11] },
};
