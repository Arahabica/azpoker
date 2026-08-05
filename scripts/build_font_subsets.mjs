#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = optionValue("--source-dir");
const workDirectory = mkdtempSync(path.join(tmpdir(), "anzan-poker-fonts-"));

const sources = {
  kosugi: {
    filename: "KosugiMaru-Regular.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/apache/kosugimaru/KosugiMaru-Regular.ttf",
  },
  mplus: {
    filename: "MPLUSRounded1c-Regular.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/mplusrounded1c/MPLUSRounded1c-Regular.ttf",
  },
};

const landingText =
  "暗算ポーカー確率を瞬時に判断して、もっと強くなろう！クイズをはじめる";
const systemFontSourcePaths = new Set(
  [
    "src/app-route.ts",
    "src/screens/LandingScreen.svelte",
    "src/screens/HistoryScreen.svelte",
    "src/screens/TermsScreen.svelte",
    "src/screens/CreditsScreen.svelte",
    "src/components/LandingQuizPreview.svelte",
    "src/components/HoldemOverview.svelte",
    "src/components/HistoryList.svelte",
    "src/components/PublicPageShell.svelte",
    "src/components/SiteFooter.svelte",
  ].map((filename) => path.join(root, filename)),
);
const mplusText =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.%";
const gameText = collectGameText();

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} にはディレクトリを指定してください`);
  }
  return path.resolve(value);
}

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectSourceFiles(entryPath);
      }
      return /\.(?:ts|svelte)$/.test(entry.name) ? [entryPath] : [];
    });
}

function collectGameText() {
  const source =
    collectSourceFiles(path.join(root, "src"))
      .filter((filename) => !systemFontSourcePaths.has(filename))
      .map((filename) => readFileSync(filename, "utf8"))
      .join("") + collectQuestionText();
  const punctuation = new Set([..." 、。？！・ー./:_-"]);
  const characters = [...source].filter(
    (character) =>
      /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}々]/u.test(
        character,
      ) || punctuation.has(character),
  );
  return uniqueCharacters(characters.join(""));
}

function collectQuestionText() {
  const directory = path.join(root, "public", "questions");
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(path.join(directory, entry.name))
        .filter((filename) => filename.endsWith(".json"))
        .map((filename) =>
          readFileSync(path.join(directory, entry.name, filename), "utf8"),
        ),
    )
    .join("");
}

function uniqueCharacters(text) {
  return [...new Set(text)].join("");
}

async function prepareSource({ filename, url }) {
  const target = path.join(workDirectory, filename);
  if (sourceDirectory) {
    const localSource = path.join(sourceDirectory, filename);
    if (!existsSync(localSource)) {
      throw new Error(`原本フォントが見つかりません: ${localSource}`);
    }
    copyFileSync(localSource, target);
    return target;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `原本フォントを取得できません: ${url} (${response.status})`,
    );
  }
  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  return target;
}

function buildSubset({ sourcePath, text, outputName, targetPath }) {
  const outputDirectory = path.join(workDirectory, outputName);
  execFileSync(
    "fontslice",
    [
      path.basename(sourcePath),
      "-o",
      outputName,
      "--weight",
      "400",
      "--text",
      text,
    ],
    { cwd: workDirectory, stdio: "inherit" },
  );

  const cssFilename = path.join(
    outputDirectory,
    `${path.basename(sourcePath, path.extname(sourcePath))}.css`,
  );
  const firstRule = readFileSync(cssFilename, "utf8").split("\n").find(Boolean);
  const sourceMatch = firstRule?.match(/url\("([^"]+\.woff2)"\)/);
  const rangeMatch = firstRule?.match(/unicode-range:\s*([^;]+)/);
  if (!sourceMatch || !rangeMatch) {
    throw new Error(`指定文字サブセットを特定できません: ${cssFilename}`);
  }

  const generatedFont = path.join(outputDirectory, sourceMatch[1]);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(generatedFont, targetPath);

  const contents = readFileSync(targetPath);
  return {
    characters: [...new Set(text)].length,
    range: rangeMatch[1].toUpperCase(),
    size: statSync(targetPath).size,
    sha256: createHash("sha256").update(contents).digest("hex"),
  };
}

async function main() {
  try {
    const kosugiSource = await prepareSource(sources.kosugi);
    const mplusSource = await prepareSource(sources.mplus);
    const definitions = [
      {
        label: "Kosugi Maru / landing",
        sourcePath: kosugiSource,
        text: landingText,
        outputName: "kosugi-landing",
        targetPath: path.join(
          root,
          "assets/fonts/kosugi-maru/KosugiMaru-Landing.woff2",
        ),
      },
      {
        label: "Kosugi Maru / game",
        sourcePath: kosugiSource,
        text: gameText,
        outputName: "kosugi-game",
        targetPath: path.join(
          root,
          "assets/fonts/kosugi-maru/KosugiMaru-Game.woff2",
        ),
      },
      {
        label: "M PLUS Rounded 1c / alphanumeric",
        sourcePath: mplusSource,
        text: mplusText,
        outputName: "mplus-ui",
        targetPath: path.join(
          root,
          "assets/fonts/m-plus-rounded-1c/MPLUSRounded1c-UI.woff2",
        ),
      },
    ];

    for (const definition of definitions) {
      const result = buildSubset(definition);
      console.log(`\n${definition.label}`);
      console.log(`  file: ${path.relative(root, definition.targetPath)}`);
      console.log(`  characters: ${result.characters}`);
      console.log(`  unicode-range: ${result.range}`);
      console.log(`  size: ${result.size} bytes`);
      console.log(`  sha256: ${result.sha256}`);
    }
  } finally {
    rmSync(workDirectory, { recursive: true, force: true });
  }
}

await main();
