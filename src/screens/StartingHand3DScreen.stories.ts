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
    await expect(getComputedStyle(heading).backgroundColor).toBe(
      "rgba(0, 0, 0, 0)",
    );
    await expect(getComputedStyle(heading).borderTopWidth).toBe("0px");
    const view = heading.ownerDocument.defaultView!;
    const headingBounds = heading.getBoundingClientRect();
    await expect(
      Math.abs(
        headingBounds.left + headingBounds.width / 2 - view.innerWidth / 2,
      ),
    ).toBeLessThan(1);
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
    const resetButton = canvas.getByRole("button", {
      name: "視点をリセット",
    });
    const topLink = canvas.getByRole("link", {
      name: "トップページへ戻る",
    });
    const navigationSurface = topLink.closest<HTMLElement>(
      ".navigation-surface",
    );
    await expect(navigationSurface).not.toBeNull();
    await expect(getComputedStyle(navigationSurface!).backgroundColor).toBe(
      "rgba(0, 0, 0, 0.62)",
    );
    await expect(getComputedStyle(navigationSurface!).paddingLeft).toBe("16px");
    await expect(getComputedStyle(navigationSurface!).paddingRight).toBe(
      "16px",
    );
    await expect(getComputedStyle(resetButton).backgroundColor).toBe(
      "rgba(0, 0, 0, 0.62)",
    );
    const resetBounds = resetButton.getBoundingClientRect();
    await expect(
      Math.abs(resetBounds.left + resetBounds.width / 2 - view.innerWidth / 2),
    ).toBeLessThan(1);
    await expect(
      navigationSurface!.getBoundingClientRect().top,
    ).toBeGreaterThan(view.innerHeight / 2);
    const sceneCanvas = visualization.querySelector("canvas");
    await expect(sceneCanvas).not.toBeNull();
    const sceneBounds = sceneCanvas!.getBoundingClientRect();
    async function tapScene(
      xFraction: number,
      yFraction: number,
    ): Promise<void> {
      await userEvent.pointer({
        coords: {
          clientX: sceneBounds.left + sceneBounds.width * xFraction,
          clientY: sceneBounds.top + sceneBounds.height * yFraction,
        },
        keys: "[MouseLeft]",
        target: sceneCanvas!,
      });
    }

    let selected = false;
    for (const yFraction of [0.5, 0.58, 0.66, 0.74, 0.82]) {
      for (const xFraction of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        await tapScene(xFraction, yFraction);
        await new Promise<void>((resolve) =>
          view.requestAnimationFrame(() => resolve()),
        );
        if (visualization.dataset.selectedHand) {
          selected = true;
          break;
        }
      }
      if (selected) break;
    }
    await expect(selected).toBe(true);
    const selectedHand =
      visualization.ownerDocument.querySelector<HTMLElement>(".selected-hand");
    await expect(selectedHand).not.toBeNull();
    const selectedBounds = selectedHand!.getBoundingClientRect();
    await expect(selectedBounds.top).toBeGreaterThan(
      heading.getBoundingClientRect().bottom,
    );
    await expect(selectedBounds.bottom).toBeLessThan(view.innerHeight / 2);

    await tapScene(0.98, 0.05);
    await waitFor(async () => {
      await expect(visualization).toHaveAttribute("data-selected-hand", "");
      await expect(
        visualization.ownerDocument.querySelector(".selected-hand"),
      ).not.toBeInTheDocument();
    });
    await expect(
      canvas.queryByText(
        "柱の高さで、6人卓におけるスターティングハンドの勝率を比べられます。",
      ),
    ).not.toBeInTheDocument();
    await expect(canvas.queryByText("30%以上")).not.toBeInTheDocument();
    await userEvent.click(topLink);
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
