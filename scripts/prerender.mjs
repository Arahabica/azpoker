import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = new URL("../dist/", import.meta.url);
const templatePath = fileURLToPath(new URL("index.html", outputDirectory));
const serverOutput = new URL("../.prerender/entry-server.js", import.meta.url);
const serverOutputDirectory = fileURLToPath(
  new URL("../.prerender", import.meta.url),
);
const outlet = "<!--app-html-->";
const headOutlet = "<!--app-head-->";
const historyDetailOutput = "history-detail/index.html";
const pages = [
  { pathname: "/", output: "index.html", marker: 'id="landing"' },
  {
    pathname: "/history",
    output: "history/index.html",
    marker: "まだ履歴がありません",
  },
  { pathname: "/terms", output: "terms/index.html", marker: "利用規約" },
  {
    pathname: "/credits",
    output: "credits/index.html",
    marker: "素材・開発者",
  },
];

try {
  const { renderApp } = await import(serverOutput);
  const template = await readFile(templatePath, "utf8");

  if (!template.includes(outlet) || !template.includes(headOutlet)) {
    throw new Error("プリレンダリング先が見つかりません");
  }

  const historyDetailPath = fileURLToPath(
    new URL(historyDetailOutput, outputDirectory),
  );
  const historyDetailHtml = template
    .replace(headOutlet, "")
    .replace(outlet, "");
  await mkdir(dirname(historyDetailPath), { recursive: true });
  await writeFile(historyDetailPath, historyDetailHtml);

  for (const page of pages) {
    const { body, head } = renderApp(page.pathname);
    if (!body.includes(page.marker) || !head.includes("<title>")) {
      throw new Error(`${page.pathname}のプリレンダリングに失敗しました`);
    }

    const html = template.replace(headOutlet, head).replace(outlet, body);
    const outputPath = fileURLToPath(new URL(page.output, outputDirectory));

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }
} finally {
  await rm(serverOutputDirectory, { recursive: true, force: true });
}
