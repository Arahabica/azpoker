import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import PrepareScreen from "./PrepareScreen.svelte";

const LOAD_ERROR =
  "問題を読み込めませんでした。通信環境を確認して、もう一度お試しください。";

const meta = {
  title: "画面/開始準備",
  component: PrepareScreen,
  args: {
    soundEnabled: true,
    ready: true,
    error: "",
    onSoundChange: fn(),
    onStart: fn(),
    onRetry: fn(),
    onHome: fn(),
  },
} satisfies Meta<typeof PrepareScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyWithSound: Story = {
  name: "準備完了・音あり",
  play: async ({ args, canvas, userEvent }) => {
    const soundButton = canvas.getByRole("button", { name: "音をなしにする" });
    await expect(soundButton).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(soundButton);
    await expect(args.onSoundChange).toHaveBeenCalledWith(false);

    await userEvent.click(canvas.getByRole("button", { name: "スタート" }));
    await expect(args.onStart).toHaveBeenCalledTimes(1);
    const homeLink = canvas.getByRole("link", { name: "トップに戻る" });
    await expect(homeLink.querySelector(".leave-icon")).toBeInTheDocument();
    await userEvent.click(homeLink);
    await expect(args.onHome).toHaveBeenCalledTimes(1);
  },
};

export const ReadyWithoutSound: Story = {
  name: "準備完了・音なし",
  args: { soundEnabled: false },
  play: async ({ args, canvas, userEvent }) => {
    const soundButton = canvas.getByRole("button", { name: "音をありにする" });
    await expect(soundButton).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(soundButton);
    await expect(args.onSoundChange).toHaveBeenCalledWith(true);
  },
};

export const WaitingForData: Story = {
  name: "開始待ち",
  args: { ready: false },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "スタート" }),
    ).toBeDisabled();
  },
};

export const LoadError: Story = {
  name: "読み込みエラー",
  args: { ready: false, error: LOAD_ERROR },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(LOAD_ERROR);
    await userEvent.click(
      canvas.getByRole("button", { name: "もう一度読み込む" }),
    );
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const MinimumWidthError: Story = {
  name: "最小幅280px・読み込みエラー",
  args: { ready: false, error: LOAD_ERROR },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};
