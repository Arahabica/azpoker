import type { Meta, StoryObj } from "@storybook/svelte-vite";

import CardGallery from "./CardGallery.svelte";

const meta = {
  title: "コンポーネント/カード",
  component: CardGallery,
} satisfies Meta<typeof CardGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RepresentativeRanks: Story = {
  name: "代表ランクと4スート",
};

export const MinimumWidth: Story = {
  name: "最小幅280px",
  globals: {
    viewport: { value: "minimum", isRotated: false },
  },
};
