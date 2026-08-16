import type { Meta, StoryObj } from "@storybook/svelte-vite";

import PerfectResultPreview from "./PerfectResultPreview.svelte";

const meta = {
  title: "確認/全問正解演出",
  component: PerfectResultPreview,
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof PerfectResultPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SoundAndAnimation: Story = {
  name: "音・スポットライト・紙吹雪を再生",
};
