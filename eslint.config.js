import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

import svelteConfig from "./svelte.config.js";

export default defineConfig(
  {
    ignores: [
      ".pnpm-store/**",
      ".prerender/**",
      "dist/**",
      "node_modules/**",
      "public/questions/**",
      "storybook-static/**",
    ],
  },
  js.configs.recommended,
  ts.configs.recommendedTypeChecked,
  svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        extraFileExtensions: [".svelte"],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    extends: [ts.configs.disableTypeChecked],
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        projectService: true,
        svelteConfig,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  svelte.configs.prettier,
  eslintConfigPrettier,
);
