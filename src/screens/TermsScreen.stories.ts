import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn } from "storybook/test";

import TermsScreen from "./TermsScreen.svelte";

const meta = {
  title: "画面/利用規約",
  component: TermsScreen,
  args: {
    onNavigate: fn(),
  },
} satisfies Meta<typeof TermsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "利用規約",
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { level: 1, name: "利用規約" }),
    ).toBeVisible();
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
};
