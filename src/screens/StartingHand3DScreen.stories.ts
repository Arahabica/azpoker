import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, waitFor } from "storybook/test";

import StartingHand3DScreen from "./StartingHand3DScreen.svelte";

const meta = {
  title: "画面/スターティングハンド勝率表3D",
  component: StartingHand3DScreen,
  args: {
    onNavigate: fn(),
  },
} satisfies Meta<typeof StartingHand3DScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "3D勝率表",
  play: async ({ args, canvas, userEvent }) => {
    const heading = canvas.getByRole("heading", {
      level: 1,
      name: "スターティングハンド勝率表(3D)",
    });
    await expect(heading).toBeVisible();
    await expect(getComputedStyle(heading).fontSize).toBe("20px");
    const visualization = await canvas.findByRole(
      "img",
      {
        name: "6人卓のスターティングハンド勝率を高さで表した3D柱グラフ",
      },
      { timeout: 10_000 },
    );
    await expect(visualization).toHaveAttribute("data-bar-count", "169");
    await expect(visualization).toHaveAttribute("data-selected-hand", "");
    await expect(
      canvas.getByRole("table", {
        name: "6人卓のスターティングハンド勝率表",
      }),
    ).toBeInTheDocument();
    await waitFor(
      async () => {
        await expect(
          canvas.getByRole("button", { name: "視点をリセット" }),
        ).toBeEnabled();
      },
      { timeout: 10_000 },
    );
    await expect(
      canvas.queryByText(
        "柱の高さで、6人卓におけるスターティングハンドの勝率を比べられます。",
      ),
    ).not.toBeInTheDocument();
    await expect(canvas.queryByText("30%以上")).not.toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("link", { name: "トップページへ戻る" }),
    );
    await expect(args.onNavigate).toHaveBeenCalledWith("/");
  },
};

export const MinimumWidth: Story = {
  name: "最小幅280px",
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
  play: async ({ canvas, canvasElement }) => {
    await canvas.findByRole(
      "img",
      {
        name: "6人卓のスターティングハンド勝率を高さで表した3D柱グラフ",
      },
      { timeout: 10_000 },
    );
    const page = canvasElement.querySelector<HTMLElement>(
      ".immersive-three-dimensional-page",
    );
    const scene = canvasElement.querySelector<HTMLElement>(".scene-frame");
    await expect(page).not.toBeNull();
    await expect(scene).not.toBeNull();
    const view = canvasElement.ownerDocument.defaultView!;
    await expect(page!.getBoundingClientRect().width).toBe(view.innerWidth);
    await expect(page!.getBoundingClientRect().height).toBe(view.innerHeight);
    await expect(scene!.getBoundingClientRect().width).toBe(view.innerWidth);
    await expect(page!.scrollWidth).toBeLessThanOrEqual(page!.clientWidth);
  },
};

export const DesktopWidth: Story = {
  name: "PC全幅1280px",
  globals: {
    viewport: { value: "desktopWide", isRotated: false },
  },
  play: async ({ canvas, canvasElement }) => {
    await canvas.findByRole(
      "img",
      {
        name: "6人卓のスターティングハンド勝率を高さで表した3D柱グラフ",
      },
      { timeout: 10_000 },
    );
    const page = canvasElement.querySelector<HTMLElement>(
      ".immersive-three-dimensional-page",
    );
    const scene = canvasElement.querySelector<HTMLElement>(".scene-frame");
    await expect(page).not.toBeNull();
    await expect(scene).not.toBeNull();
    const view = canvasElement.ownerDocument.defaultView!;
    await expect(page!.getBoundingClientRect().width).toBe(view.innerWidth);
    await expect(scene!.getBoundingClientRect().width).toBe(view.innerWidth);
    await expect(view.innerWidth).toBe(1280);
  },
};
