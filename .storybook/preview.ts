import type { Preview } from "@storybook/svelte-vite";

import "../styles.css";
import "./preview.css";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "error",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: {
        minimum: {
          name: "最小幅 280px / 低い画面",
          styles: { width: "280px", height: "620px" },
          type: "mobile",
        },
        mobile: {
          name: "モバイル 320px",
          styles: { width: "320px", height: "720px" },
          type: "mobile",
        },
        appMaximum: {
          name: "アプリ最大幅 480px",
          styles: { width: "480px", height: "800px" },
          type: "mobile",
        },
        desktopBoundary: {
          name: "PC境界 481px",
          styles: { width: "481px", height: "800px" },
          type: "desktop",
        },
      },
    },
  },
};

export default preview;
