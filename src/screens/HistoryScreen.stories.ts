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
    onLeaveDetail: fn(),
  },
} satisfies Meta<typeof HistoryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "履歴なし",
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
};

export const MissingDetail: Story = {
  name: "履歴詳細・見つからない",
  args: {
    history: historyEntries,
    detailId: "missing-history",
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
};
