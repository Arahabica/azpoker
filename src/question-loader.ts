import type { Question, QuestionManifest, RandomSource } from "./types.ts";

type QuestionGroup = "A" | "BC" | "D";

const MANIFEST_URL = "/questions/manifest.json";
const RECENT_FILES_KEY = "anzan-poker:recent-question-files";
const RECENT_QUESTIONS_KEY = "anzan-poker:recent-questions";
const GROUP_ORDER: readonly QuestionGroup[] = Object.freeze(["A", "BC", "D"]);

let manifestPromise: Promise<QuestionManifest> | undefined;
let activeBatches = new Map<QuestionGroup, Question[]>();

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function readList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(storage()?.getItem(key) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeList(key: string, values: readonly string[]): void {
  try {
    storage()?.setItem(key, JSON.stringify(values));
  } catch {
    // 保存できない環境でも、問題の取得とクイズ進行は継続する。
  }
}

async function fetchJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error("問題を読み込めませんでした");
  return response.json() as Promise<T>;
}

async function loadManifest(
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<QuestionManifest> {
  manifestPromise ??= fetchJson<QuestionManifest>(MANIFEST_URL, fetchImpl);
  return manifestPromise;
}

function chooseFile(
  group: QuestionGroup,
  fileCount: number,
  random: RandomSource,
): number {
  const recent = readList(RECENT_FILES_KEY);
  const candidates = Array.from({ length: fileCount }, (_, index) => index + 1);
  const unused = candidates.filter(
    (number) => !recent.includes(`${group}:${number}`),
  );
  const source = unused.length > 0 ? unused : candidates;
  const number = source[Math.floor(random() * source.length)]!;
  writeList(RECENT_FILES_KEY, [...recent, `${group}:${number}`].slice(-40));
  return number;
}

function freshQuestions(batch?: readonly Question[]): Question[] {
  const recent = new Set(readList(RECENT_QUESTIONS_KEY));
  return (batch ?? []).filter((question) => !recent.has(question.id));
}

function defaultQuestions(batch?: readonly Question[]): Question[] {
  return freshQuestions(batch).filter(
    (question) => question.level !== "advanced",
  );
}

function canSupply(group: QuestionGroup, batch?: readonly Question[]): boolean {
  const questions = defaultQuestions(batch);
  if (group === "A") {
    return (
      new Set(
        questions
          .filter((question) => question.mode === "A")
          .map((question) => question.category),
      ).size >= 5
    );
  }
  if (group === "BC") {
    const classic = questions.filter(
      (question) => question.mode === "B" && question.answerType === "hand",
    );
    const numeric = questions.filter(
      (question) => question.mode === "B" && question.answerType === "percent",
    );
    return (
      classic.length >= 1 &&
      numeric.length >= 1 &&
      questions.some((question) => question.mode === "C")
    );
  }
  return (
    new Set(
      questions
        .filter((question) => question.mode === "D")
        .map((question) => question.category),
    ).size >= 2
  );
}

async function loadGroup(
  group: QuestionGroup,
  manifest: QuestionManifest,
  random: RandomSource,
  fetchImpl: typeof fetch,
): Promise<void> {
  const details = manifest.groups[group];
  const number = chooseFile(group, details.files, random);
  const filename = String(number).padStart(4, "0");
  const batch = await fetchJson<Question[]>(
    `/questions/${details.path}/${filename}.json?v=${manifest.version}`,
    fetchImpl,
  );
  activeBatches.set(group, batch);
}

async function loadQuestionPool(
  random: RandomSource = Math.random,
  fetchImpl: typeof fetch = globalThis.fetch,
  refreshGroup: QuestionGroup | null = null,
): Promise<Question[]> {
  const manifest = await loadManifest(fetchImpl);
  await Promise.all(
    GROUP_ORDER.filter(
      (group) =>
        group === refreshGroup || !canSupply(group, activeBatches.get(group)),
    ).map((group) => loadGroup(group, manifest, random, fetchImpl)),
  );
  return GROUP_ORDER.flatMap((group) =>
    freshQuestions(activeBatches.get(group)),
  );
}

function rememberQuestions(questions: readonly Question[]): void {
  const recent = readList(RECENT_QUESTIONS_KEY);
  writeList(
    RECENT_QUESTIONS_KEY,
    [...recent, ...questions.map((question) => question.id)].slice(-500),
  );
}

function resetQuestionLoaderForTest(): void {
  manifestPromise = undefined;
  activeBatches = new Map<QuestionGroup, Question[]>();
}

export {
  loadManifest,
  loadQuestionPool,
  rememberQuestions,
  resetQuestionLoaderForTest,
};
