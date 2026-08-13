import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import { historyDetailEntry, historyEntries } from "../storybook/fixtures.ts";
import HistoryScreen from "./HistoryScreen.svelte";

const meta = {
  title: "画面/履歴",
  component: HistoryScreen,
  args: {
    history: [],
    detailId: null,
    detailNavigationPath: "/history",
    detailNavigationLabel: "履歴一覧へ戻る",
    detailNavigationAriaLabel: "履歴一覧へ戻る",
    onNavigate: fn(),
    onOpenHistory: fn(),
    onOpenOlderHistory: fn(),
    onLeaveDetail: fn(),
  },
} satisfies Meta<typeof HistoryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "履歴なし",
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { name: "まだ履歴がありません" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "問題に挑戦する" }),
    );
    await expect(args.onNavigate).toHaveBeenCalledWith("/");
  },
};

export const List: Story = {
  name: "履歴一覧",
  args: { history: historyEntries },
  play: async ({ args, canvas, userEvent }) => {
    const rows = canvas.getAllByRole("button", { name: /詳細を見る/ });
    await userEvent.click(rows[0]!);
    await expect(args.onOpenHistory).toHaveBeenCalledWith(
      historyDetailEntry.id,
    );
  },
};

export const DetailFromHistory: Story = {
  name: "履歴詳細・一覧から遷移",
  args: {
    history: historyEntries,
    detailId: historyDetailEntry.id,
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { name: "回答の振り返り" }),
    ).toBeVisible();
    await expect(canvas.getAllByText("解説")).toHaveLength(2);
    await expect(canvas.getByText("難易度: ふつう")).toBeVisible();
    await expect(canvas.getByText("難易度: むずかしい")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "次へ" }));
    await expect(args.onOpenOlderHistory).toHaveBeenCalledWith(
      historyEntries[1]!.id,
    );
    await userEvent.click(canvas.getByRole("link", { name: "履歴一覧へ戻る" }));
    await expect(args.onLeaveDetail).toHaveBeenCalledWith("/history");
  },
};

export const OldestDetail: Story = {
  name: "履歴詳細・最古",
  args: {
    history: historyEntries,
    detailId: historyEntries[1]!.id,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "次へ" })).toBeNull();
  },
};

export const DetailFromTop: Story = {
  name: "履歴詳細・トップから遷移",
  args: {
    history: historyEntries,
    detailId: historyDetailEntry.id,
    detailNavigationPath: "/",
    detailNavigationLabel: "トップへ",
    detailNavigationAriaLabel: "トップページへ戻る",
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("link", { name: "トップページへ戻る" }),
    );
    await expect(args.onLeaveDetail).toHaveBeenCalledWith("/");
  },
};

export const MissingDetail: Story = {
  name: "履歴詳細・見つからない",
  args: {
    history: historyEntries,
    detailId: "missing-history",
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "履歴が見つかりません" }),
    ).toBeVisible();
  },
};

export const MinimumWidthDetail: Story = {
  name: "最小幅280px・履歴詳細",
  args: {
    history: historyEntries,
    detailId: historyDetailEntry.id,
  },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const detail = canvasElement.querySelector<HTMLElement>(".history-detail");
    const questions =
      canvasElement.querySelectorAll<HTMLElement>(".history-question");
    const questionItems = canvasElement.querySelectorAll<HTMLElement>(
      ".question-history > li",
    );

    await expect(detail).not.toBeNull();
    await expect(detail!.scrollWidth).toBeLessThanOrEqual(detail!.clientWidth);
    await expect(questions).toHaveLength(2);
    for (const question of questions) {
      await expect(question.scrollWidth).toBeLessThanOrEqual(
        question.clientWidth,
      );
    }
    await expect(getComputedStyle(questionItems[1]!).borderTopWidth).toBe(
      "1px",
    );
  },
};
