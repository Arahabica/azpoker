const MANIFEST_URL = "/questions/manifest.json";
const RECENT_FILES_KEY = "anzan-poker:recent-question-files";
const RECENT_QUESTIONS_KEY = "anzan-poker:recent-questions";

let manifestPromise;

function storage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

function readList(key) {
  try {
    return JSON.parse(storage()?.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function writeList(key, values) {
  storage()?.setItem(key, JSON.stringify(values));
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error("問題を読み込めませんでした");
  }
  return response.json();
}

async function loadManifest(fetchImpl = fetch) {
  manifestPromise ??= fetchJson(MANIFEST_URL, fetchImpl);
  return manifestPromise;
}

function chooseFile(mode, fileCount, random) {
  const recent = readList(RECENT_FILES_KEY);
  const candidates = Array.from({ length: fileCount }, (_, index) => index + 1);
  const unused = candidates.filter((number) => !recent.includes(`${mode}:${number}`));
  const source = unused.length > 0 ? unused : candidates;
  const number = source[Math.floor(random() * source.length)];
  writeList(RECENT_FILES_KEY, [...recent, `${mode}:${number}`].slice(-40));
  return number;
}

async function loadQuestionPool(random = Math.random, fetchImpl = fetch) {
  const manifest = await loadManifest(fetchImpl);
  const modes = ["A", "B", "C", "D"];
  const batches = await Promise.all(
    modes.map(async (mode) => {
      const number = chooseFile(mode, manifest.modes[mode].files, random);
      const filename = String(number).padStart(4, "0");
      return fetchJson(
        `/questions/${mode.toLowerCase()}/${filename}.json?v=${manifest.version}`,
        fetchImpl,
      );
    }),
  );
  const recent = new Set(readList(RECENT_QUESTIONS_KEY));
  const fresh = batches.flat().filter((question) => !recent.has(question.id));
  return fresh.length >= 10 ? fresh : batches.flat();
}

function rememberQuestions(questions) {
  const recent = readList(RECENT_QUESTIONS_KEY);
  writeList(
    RECENT_QUESTIONS_KEY,
    [...recent, ...questions.map((question) => question.id)].slice(-500),
  );
}

function resetQuestionLoaderForTest() {
  manifestPromise = undefined;
}

export {
  loadManifest,
  loadQuestionPool,
  rememberQuestions,
  resetQuestionLoaderForTest,
};
