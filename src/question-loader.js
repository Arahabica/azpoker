const MANIFEST_URL = "/questions/manifest.json";
const RECENT_FILES_KEY = "anzan-poker:recent-question-files";
const RECENT_QUESTIONS_KEY = "anzan-poker:recent-questions";
const GROUP_ORDER = Object.freeze(["A", "BC", "D"]);

let manifestPromise;
let activeBatches = new Map();

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
  if (!response.ok) throw new Error("問題を読み込めませんでした");
  return response.json();
}

async function loadManifest(fetchImpl = fetch) {
  manifestPromise ??= fetchJson(MANIFEST_URL, fetchImpl);
  return manifestPromise;
}

function chooseFile(group, fileCount, random) {
  const recent = readList(RECENT_FILES_KEY);
  const candidates = Array.from({ length: fileCount }, (_, index) => index + 1);
  const unused = candidates.filter((number) => !recent.includes(`${group}:${number}`));
  const source = unused.length > 0 ? unused : candidates;
  const number = source[Math.floor(random() * source.length)];
  writeList(RECENT_FILES_KEY, [...recent, `${group}:${number}`].slice(-40));
  return number;
}

function freshQuestions(batch) {
  const recent = new Set(readList(RECENT_QUESTIONS_KEY));
  return (batch ?? []).filter((question) => !recent.has(question.id));
}

function canSupply(group, batch) {
  const questions = freshQuestions(batch);
  if (group === "A") {
    return new Set(questions.filter((question) => question.mode === "A").map((question) => question.category)).size >= 5;
  }
  if (group === "BC") {
    const classic = questions.filter((question) => question.mode === "B" && question.answerType === "hand");
    const numeric = questions.filter((question) => question.mode === "B" && question.answerType === "percent");
    return classic.length >= 1 && numeric.length >= 1 && questions.some((question) => question.mode === "C");
  }
  return new Set(questions.filter((question) => question.mode === "D").map((question) => question.category)).size >= 2;
}

async function loadGroup(group, manifest, random, fetchImpl) {
  const details = manifest.groups[group];
  const number = chooseFile(group, details.files, random);
  const filename = String(number).padStart(4, "0");
  const batch = await fetchJson(`/questions/${details.path}/${filename}.json?v=${manifest.version}`, fetchImpl);
  activeBatches.set(group, batch);
}

async function loadQuestionPool(random = Math.random, fetchImpl = fetch, refreshGroup = null) {
  const manifest = await loadManifest(fetchImpl);
  await Promise.all(
    GROUP_ORDER
      .filter((group) => group === refreshGroup || !canSupply(group, activeBatches.get(group)))
      .map((group) => loadGroup(group, manifest, random, fetchImpl)),
  );
  return GROUP_ORDER.flatMap((group) => freshQuestions(activeBatches.get(group)));
}

function rememberQuestions(questions) {
  const recent = readList(RECENT_QUESTIONS_KEY);
  writeList(RECENT_QUESTIONS_KEY, [...recent, ...questions.map((question) => question.id)].slice(-500));
}

function resetQuestionLoaderForTest() {
  manifestPromise = undefined;
  activeBatches = new Map();
}

export { loadManifest, loadQuestionPool, rememberQuestions, resetQuestionLoaderForTest };
