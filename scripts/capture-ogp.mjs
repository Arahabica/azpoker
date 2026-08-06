import { spawn } from "node:child_process";
import { access, copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicImage = join(projectRoot, "public", "ogp.png");
const builtImage = join(projectRoot, "dist", "ogp.png");
const previewOrigin = "http://127.0.0.1:4173";
const captureUrl = `${previewOrigin}/?capture=ogp`;

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // 次の既知パスを試す。
    }
  }
  throw new Error(
    "Chromeが見つかりません。CHROME_PATHに実行ファイルを指定してください。",
  );
}

async function waitForPreview(preview) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) {
      throw new Error("プレビューサーバーを起動できませんでした。");
    }
    try {
      const response = await fetch(previewOrigin);
      if (response.ok) return;
    } catch {
      // 起動完了まで短く待つ。
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error("プレビューサーバーの起動待ちがタイムアウトしました。");
}

async function verifyImageSize(path) {
  const image = await readFile(path);
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    throw new Error(`OGP画像が${width}×${height}pxで生成されました。`);
  }
}

async function waitForImage(capture) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      await verifyImageSize(publicImage);
      return;
    } catch {
      if (capture.exitCode !== null) {
        throw new Error(
          `Chromeが画像を生成せず終了しました（code=${String(capture.exitCode)}）。`,
        );
      }
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error("OGP画像の生成待ちがタイムアウトしました。");
}

async function stopProcess(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => child.once("exit", resolveExit)),
    new Promise((resolveWait) => setTimeout(resolveWait, 2_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

const chrome = await findChrome();
const profileDirectory = await mkdtemp(join(tmpdir(), "anzan-poker-ogp-"));
const preview = spawn(
  "pnpm",
  ["preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
  {
    cwd: projectRoot,
    stdio: "ignore",
  },
);

try {
  await waitForPreview(preview);
  await rm(publicImage, { force: true });
  const capture = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--force-device-scale-factor=1",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=1200",
      "--window-size=1200,630",
      `--user-data-dir=${profileDirectory}`,
      `--screenshot=${publicImage}`,
      captureUrl,
    ],
    { cwd: projectRoot, stdio: "ignore" },
  );
  await waitForImage(capture);
  await stopProcess(capture);
  await copyFile(publicImage, builtImage);
  process.stdout.write(`OGP画像を生成しました: ${publicImage}\n`);
} finally {
  await stopProcess(preview);
  await rm(profileDirectory, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
