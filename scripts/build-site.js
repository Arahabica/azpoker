"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const clientOutput = path.join(output, "client");
const serverOutput = path.join(output, "server");
const clientFiles = [
  "index.html",
  "styles.css",
  "src/app.js",
  "src/game.js",
  "src/question-bank.js",
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(clientOutput, { recursive: true });
fs.mkdirSync(serverOutput, { recursive: true });

for (const relativePath of clientFiles) {
  const source = path.join(root, relativePath);
  const destination = path.join(clientOutput, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.copyFileSync(
  path.join(root, "hosting", "worker.js"),
  path.join(serverOutput, "index.js"),
);

console.log("dist に静的サイトをビルドしました");
