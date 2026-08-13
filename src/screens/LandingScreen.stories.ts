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
    const historySlot = canvas.getByTestId("recent-history-slot");
    await expect(getComputedStyle(historySlot).minHeight).toBe("184px");
    await expect(historySlot.getBoundingClientRect().height).toBe(184);
    const startButtons = canvas.getAllByRole("button", {
      name: "クイズをはじめる",
    });
    await expect(startButtons).toHaveLength(2);
    await expect(
      canvas.getByRole("heading", { level: 3, name: "プリフロップ勝率表" }),
    ).toBeVisible();
    const holdemHeading = canvas.getByRole("heading", {
      level: 3,
      name: "テキサスホールデム",
    });
    const appendixHeading = canvas.getByRole("heading", {
      level: 2,
      name: "付録",
    });
    await expect(appendixHeading).toBeVisible();
    await expect(
      holdemHeading.compareDocumentPosition(appendixHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(
      canvas.getByRole("table", { name: "6人卓のプリフロップ勝率表" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("cell")).toHaveLength(169);
    await expect(
      canvas.getByRole("cell", { name: "AA、とても強い" }),
    ).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "KQo、強い" })).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "A5s、中" })).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "Q2s、弱い" })).toBeVisible();
    await expect(
      canvas.getByRole("cell", { name: "Q7o、とても弱い" }),
    ).toBeVisible();
    const strengthCells = [
      canvas.getByRole("cell", { name: "AA、とても強い" }),
      canvas.getByRole("cell", { name: "KQo、強い" }),
      canvas.getByRole("cell", { name: "A5s、中" }),
      canvas.getByRole("cell", { name: "Q2s、弱い" }),
      canvas.getByRole("cell", { name: "Q7o、とても弱い" }),
    ];
    for (const cell of strengthCells) {
      await expect(getComputedStyle(cell).borderTopWidth).toBe("0px");
      await expect(getComputedStyle(cell).borderRadius).toBe("0px");
    }
    await expect(getComputedStyle(strengthCells[3]!).backgroundColor).toBe(
      "rgba(245, 245, 240, 0.52)",
    );
    await expect(canvas.queryAllByRole("columnheader")).toHaveLength(0);
    await expect(canvas.queryAllByRole("rowheader")).toHaveLength(0);
    await expect(canvas.queryByText("49.2")).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "LA Poker.info" }),
    ).toHaveAttribute("href", "https://lapoker.info/ranking/");
    const ninePlayers = canvas.getByRole("button", { name: "9人卓" });
    await userEvent.click(ninePlayers);
    await expect(ninePlayers).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.getByRole("table", { name: "9人卓のプリフロップ勝率表" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("cell", { name: "AA、とても強い" }),
    ).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "AKs、中" })).toBeVisible();
    await userEvent.click(startButtons[0]!);
    await expect(args.onStart).toHaveBeenCalledTimes(1);
  },
};

export const WithOneHistory: Story = {
  name: "履歴1件",
  args: { history: [historyDetailEntry] },
};

export const WithHistory: Story = {
  name: "最近の履歴あり",
  args: { history: landingHistoryEntries },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { level: 2, name: "最近の履歴" }),
    ).toBeVisible();
    const historySlot = canvas.getByTestId("recent-history-slot");
    await expect(getComputedStyle(historySlot).minHeight).toBe("184px");
    await expect(historySlot.getBoundingClientRect().height).toBe(184);

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
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector<HTMLElement>(".equity-chart");
    const table = canvasElement.querySelector<HTMLTableElement>(
      ".equity-chart table",
    );
    const app = canvasElement.querySelector<HTMLElement>(".landing-screen");

    await expect(chart).not.toBeNull();
    await expect(table).not.toBeNull();
    await expect(app).not.toBeNull();
    await expect(chart!.scrollWidth).toBeLessThanOrEqual(chart!.clientWidth);
    await expect(table!.scrollWidth).toBeLessThanOrEqual(table!.clientWidth);
    await expect(app!.scrollWidth).toBeLessThanOrEqual(app!.clientWidth);
    await expect(chart!.getBoundingClientRect().width).toBe(
      app!.getBoundingClientRect().width,
    );
  },
};
