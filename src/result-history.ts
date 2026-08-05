const RESULT_HISTORY_VERSION = 1 as const;
const RESULT_HISTORY_LIMIT = 50;
const RESULT_HISTORY_KEY = "anzan-poker:result-history:v1";

interface HistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface QuizHistoryEntry {
  version: typeof RESULT_HISTORY_VERSION;
  id: string;
  completedAt: number;
  score: number;
  total: number;
  elapsedMs: number;
  timeLimitMs: number;
  timeoutCount: number;
}

type QuizHistoryResult = Omit<QuizHistoryEntry, "version" | "completedAt">;

function browserStorage(): HistoryStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isQuizHistoryEntry(value: unknown): value is QuizHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<QuizHistoryEntry>;
  return (
    entry.version === RESULT_HISTORY_VERSION &&
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    isFiniteNumber(entry.completedAt) &&
    entry.completedAt > 0 &&
    isInteger(entry.score) &&
    isInteger(entry.total) &&
    entry.total > 0 &&
    entry.score >= 0 &&
    entry.score <= entry.total &&
    isFiniteNumber(entry.elapsedMs) &&
    entry.elapsedMs >= 0 &&
    isFiniteNumber(entry.timeLimitMs) &&
    entry.timeLimitMs > 0 &&
    entry.elapsedMs <= entry.timeLimitMs &&
    isInteger(entry.timeoutCount) &&
    entry.timeoutCount >= 0 &&
    entry.timeoutCount <= entry.total - entry.score
  );
}

function parseQuizHistory(value: string | null): QuizHistoryEntry[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isQuizHistoryEntry)
      .sort((left, right) => right.completedAt - left.completedAt)
      .slice(0, RESULT_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function readQuizHistory(
  storage: HistoryStorage | null = browserStorage(),
): QuizHistoryEntry[] {
  if (!storage) return [];
  try {
    return parseQuizHistory(storage.getItem(RESULT_HISTORY_KEY));
  } catch {
    return [];
  }
}

function createQuizHistoryId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function formatRelativeHistoryTime(
  completedAt: number,
  now = Date.now(),
): string {
  const elapsedMinutes = Math.floor(
    Math.max(0, now - completedAt) / (60 * 1000),
  );
  if (elapsedMinutes < 1) return "たった今";
  if (elapsedMinutes < 60) return `${elapsedMinutes}分前`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}時間前`;

  return `${Math.floor(elapsedHours / 24)}日前`;
}

function createQuizHistoryEntry(
  result: QuizHistoryResult,
  completedAt = Date.now(),
): QuizHistoryEntry {
  const entry: QuizHistoryEntry = {
    version: RESULT_HISTORY_VERSION,
    completedAt,
    ...result,
  };
  if (!isQuizHistoryEntry(entry)) {
    throw new TypeError("保存できないクイズ結果です");
  }
  return entry;
}

function saveQuizHistory(
  entry: QuizHistoryEntry,
  storage: HistoryStorage | null = browserStorage(),
): QuizHistoryEntry[] {
  if (!isQuizHistoryEntry(entry)) {
    throw new TypeError("保存できないクイズ結果です");
  }

  const nextHistory = [
    entry,
    ...readQuizHistory(storage).filter((saved) => saved.id !== entry.id),
  ]
    .sort((left, right) => right.completedAt - left.completedAt)
    .slice(0, RESULT_HISTORY_LIMIT);

  if (storage) {
    try {
      storage.setItem(RESULT_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // 履歴を保存できなくても、クイズと結果表示は継続する。
    }
  }
  return nextHistory;
}

export {
  RESULT_HISTORY_KEY,
  RESULT_HISTORY_LIMIT,
  RESULT_HISTORY_VERSION,
  createQuizHistoryEntry,
  createQuizHistoryId,
  formatRelativeHistoryTime,
  isQuizHistoryEntry,
  parseQuizHistory,
  readQuizHistory,
  saveQuizHistory,
};
export type { HistoryStorage, QuizHistoryEntry, QuizHistoryResult };
