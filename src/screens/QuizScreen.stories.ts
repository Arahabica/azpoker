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
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("正解")).toBeVisible();
      await expect(canvas.getByText("35.0%")).toBeVisible();
    });
    const explanation = canvas.getByTestId("answer-explanation");
    const nextButton = canvas.getByRole("button", { name: "次の問題へ" });
    await expect(explanation.getBoundingClientRect().width).toBeCloseTo(
      nextButton.getBoundingClientRect().width,
      1,
    );
    await expect(getComputedStyle(explanation).textAlign).toBe("left");

    await userEvent.click(explanation);
    await expect(canvas.getByTestId("answer-explanation")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "解説を閉じる" }));
    await expect(
      canvasElement
        .querySelector<HTMLElement>(".answer-sheet")
        ?.classList.contains("is-closing"),
    ).toBe(true);
    await waitFor(async () => {
      await expect(canvas.queryByTestId("answer-explanation")).toBeNull();
      await expect(canvas.queryByLabelText("選択肢")).toBeNull();
    });

    const showExplanation = canvas.getByRole("button", {
      name: "解説を見る",
    });
    await expect(showExplanation).toBeVisible();
    await userEvent.click(showExplanation);

    await waitFor(async () => {
      await expect(canvas.getByTestId("answer-explanation")).toBeVisible();
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

export const AnsweredHand: Story = {
  name: "回答後・手札比較の解説を開閉",
  args: {
    question: handQuestion,
    currentIndex: 1,
    total: 2,
    choices: [],
    answerResult: { correct: false, selected: 1, timedOut: false },
    outcomes: ["correct", "wrong"],
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("不正解")).toBeVisible();
    });

    await userEvent.click(canvas.getByRole("button", { name: "解説を閉じる" }));
    await waitFor(async () => {
      await expect(canvas.queryByLabelText("選択肢")).toBeNull();
      await expect(canvas.getByLabelText("比較する手札")).toBeVisible();
    });
    await expect(
      canvas.getByRole("button", { name: "解説を見る" }),
    ).toBeVisible();
  },
};

export const MinimumWidthWrong: Story = {
  name: "最小幅280px・最後の問題で不正解",
  args: {
    currentIndex: 9,
    answerResult: { correct: false, selected: "20%", timedOut: false },
    outcomes: [
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "wrong",
    ],
  },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "次の問題へ" }),
      ).toBeVisible();
    });
  },
};
