import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(new URL("../dist/index.html", import.meta.url));
const serverOutput = new URL("../.prerender/entry-server.js", import.meta.url);
const serverOutputDirectory = fileURLToPath(new URL("../.prerender", import.meta.url));
const outlet = "<!--app-html-->";

try {
  const { renderApp } = await import(serverOutput);
  const { body, head } = renderApp();
  const template = await readFile(outputPath, "utf8");

  if (!template.includes(outlet)) {
    throw new Error("プリレンダリング先が見つかりません");
  }

  if (!body.includes('id="landing"') || !body.includes("暗算ポーカー")) {
    throw new Error("トップ画面のプリレンダリングに失敗しました");
  }

  const html = template
    .replace(outlet, body)
    .replace("</head>", `${head}</head>`);

  await writeFile(outputPath, html);
} finally {
  await rm(serverOutputDirectory, { recursive: true, force: true });
}
