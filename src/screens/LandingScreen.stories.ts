import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import {
  historyDetailEntry,
  landingHistoryEntries,
} from "../storybook/fixtures.ts";
import LandingScreen from "./LandingScreen.svelte";

const meta = {
  title: "画面/トップ",
  component: LandingScreen,
  args: {
    history: [],
    onStart: fn(),
    onNavigate: fn(),
    onOpenHistory: fn(),
  },
} satisfies Meta<typeof LandingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstVisit: Story = {
  name: "初回訪問・履歴なし",
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { level: 1, name: "暗算ポーカー" }),
    ).toBeVisible();
    const startButtons = canvas.getAllByRole("button", {
      name: "クイズをはじめる",
    });
    await expect(startButtons).toHaveLength(2);
    await userEvent.click(startButtons[0]!);
    await expect(args.onStart).toHaveBeenCalledTimes(1);
  },
};

export const WithHistory: Story = {
  name: "最近の履歴あり",
  args: { history: landingHistoryEntries },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { level: 2, name: "最近の履歴" }),
    ).toBeVisible();

    const historyRows = canvas.getAllByRole("button", { name: /詳細を見る/ });
    await expect(historyRows).toHaveLength(2);
    await userEvent.click(historyRows[0]!);
    await expect(args.onOpenHistory).toHaveBeenCalledWith(
      historyDetailEntry.id,
    );

    await userEvent.click(canvas.getByRole("link", { name: "もっと見る" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("/history");
  },
};

export const MinimumWidth: Story = {
  name: "最小幅280px・履歴あり",
  args: { history: landingHistoryEntries },
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};
