import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import CreditsScreen from "./CreditsScreen.svelte";

const meta = {
  title: "画面/素材・開発者",
  component: CreditsScreen,
  args: {
    onNavigate: fn(),
  },
} satisfies Meta<typeof CreditsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "素材・開発者",
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { level: 1, name: "素材・開発者" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", {
        level: 2,
        name: "スターティングハンド勝率表",
      }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("link", { name: "トップページへ戻る" }),
    );
    await expect(args.onNavigate).toHaveBeenCalledWith("/");
  },
};
