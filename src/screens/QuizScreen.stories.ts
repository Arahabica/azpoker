import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, waitFor } from "storybook/test";

import { handQuestion, percentQuestion } from "../storybook/fixtures.ts";
import QuizScreen from "./QuizScreen.svelte";

const meta = {
  title: "画面/問題",
  component: QuizScreen,
  args: {
    question: percentQuestion,
    currentIndex: 2,
    total: 10,
    choices: ["20%", "35%"],
    answerResult: null,
    outcomes: [
      "correct",
      "wrong",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    reviewMode: false,
    onLeave: fn(),
    onAnswer: fn(),
    onTimeWarning: fn(),
    onTimeout: fn(),
    onNext: fn(),
  },
} satisfies Meta<typeof QuizScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnsweringPercent: Story = {
  name: "回答中・確率問題",
  play: async ({ args, canvas, userEvent }) => {
    const choices = await canvas.findAllByRole("button");
    await userEvent.click(choices[0]!);
    await expect(args.onAnswer).toHaveBeenCalledTimes(1);
  },
};

export const Correct: Story = {
  name: "正解",
  args: {
    answerResult: { correct: true, selected: "35%", timedOut: false },
    outcomes: [
      "correct",
      "wrong",
      "correct",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("正解")).toBeVisible();
      await expect(canvas.getByText("35.0%")).toBeVisible();
    });
    await userEvent.click(canvas.getByRole("button", { name: "次の問題へ" }));
    await expect(args.onNext).toHaveBeenCalledTimes(1);
  },
};

export const Wrong: Story = {
  name: "不正解",
  args: {
    answerResult: { correct: false, selected: "20%", timedOut: false },
    outcomes: [
      "correct",
      "wrong",
      "wrong",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("不正解")).toBeVisible();
      await expect(canvas.getByText("35.0%")).toBeVisible();
    });
  },
};

export const TimedOut: Story = {
  name: "時間切れ",
  args: {
    answerResult: { correct: false, selected: null, timedOut: true },
    outcomes: [
      "correct",
      "wrong",
      "timeout",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("時間切れ")).toBeVisible();
    });
  },
};

export const ReviewHand: Story = {
  name: "復習中・手札比較",
  args: {
    question: handQuestion,
    currentIndex: 0,
    total: 2,
    choices: [],
    outcomes: [null, null],
    reviewMode: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("復習")).toBeVisible();
    await expect(canvas.getByText("難易度: むずかしい")).toBeVisible();
  },
};

export const MinimumWidthWrong: Story = {
  name: "最小幅280px・不正解",
  args: {
    answerResult: { correct: false, selected: "20%", timedOut: false },
    outcomes: [
      "correct",
      "wrong",
      "wrong",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};
