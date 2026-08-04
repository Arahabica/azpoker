import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadQuestionBank() {
  const questionsRoot = path.join(root, "public", "questions");
  return ["a", "bc", "d"].flatMap((group) =>
    fs
      .readdirSync(path.join(questionsRoot, group))
      .filter((filename) => filename.endsWith(".json"))
      .sort()
      .flatMap((filename) =>
        JSON.parse(
          fs.readFileSync(path.join(questionsRoot, group, filename), "utf8"),
        ),
      ),
  );
}

export { loadQuestionBank, root };
