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
      canvas.getByRole("heading", {
        level: 3,
        name: "スターティングハンド勝率表",
      }),
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
      canvas.getByRole("table", {
        name: "6人卓のスターティングハンド勝率表",
      }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "6人卓で最初に判断する場合の目安です。7人卓でも、最初の1人がフォールドして自分に回ってきた場合は、おおむね同じ基準です。どちらも、自分のあとに判断する相手が5人います。",
      ),
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
    await expect(canvas.getByText("16%未満")).toBeVisible();
    await expect(canvas.getByText("30%以上")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "9人卓" }),
    ).not.toBeInTheDocument();
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
    const sourceCodeLink = canvas.getByRole("link", { name: "ソースコード" });
    await expect(sourceCodeLink).toHaveAttribute(
      "href",
      "https://github.com/Arahabica/azpoker",
    );
    await expect(sourceCodeLink).toHaveAttribute("target", "_blank");
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
    const holdem = canvasElement.querySelector<HTMLElement>(".holdem-overview");

    await expect(chart).not.toBeNull();
    await expect(table).not.toBeNull();
    await expect(app).not.toBeNull();
    await expect(holdem).not.toBeNull();
    await expect(table!.scrollWidth).toBeLessThanOrEqual(table!.clientWidth);
    await expect(app!.scrollWidth).toBeLessThanOrEqual(app!.clientWidth);
    await expect(chart!.getBoundingClientRect().width).toBe(
      holdem!.getBoundingClientRect().width,
    );
    await expect(table!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      app!.getBoundingClientRect().width - 12,
    );
    await expect(table!.getBoundingClientRect().width).toBeLessThanOrEqual(
      app!.getBoundingClientRect().width,
    );
  },
};
