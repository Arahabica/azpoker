import type {
  Card,
  PercentChoice,
  Question,
  QuestionAnswer,
  QuestionOutcome,
} from "./types.ts";

const LEGACY_RESULT_HISTORY_VERSION = 1 as const;
const RESULT_HISTORY_VERSION = 2 as const;
const RESULT_HISTORY_LIMIT = 50;
// Keep the original key so existing summary-only records can be migrated.
const RESULT_HISTORY_KEY = "anzan-poker:result-history:v1";

interface HistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface QuizHistoryAnswer {
  question: Question;
  outcome: QuestionOutcome;
  selected: QuestionAnswer | null;
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
  answers: QuizHistoryAnswer[];
}

type QuizHistoryResult = Omit<
  QuizHistoryEntry,
  "version" | "completedAt" | "answers"
> & {
  answers?: readonly QuizHistoryAnswer[];
};

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

function isCard(value: unknown): value is Card {
  return typeof value === "string" && /^[2-9TJQKA][cdhs]$/.test(value);
}

function isHole(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2 && value.every(isCard);
}

function isHands(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2 && value.every(isHole);
}

function isPercentChoice(value: unknown): value is PercentChoice {
  if (typeof value !== "string" || !/^\d+(?:\.5)?%$/.test(value)) {
    return false;
  }
  const numeric = Number(value.slice(0, -1));
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100;
}

function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== "object") return false;
  const question = value as Record<string, unknown>;
  const commonFieldsAreValid =
    typeof question.id === "string" &&
    question.id.length > 0 &&
    ["A", "B", "C", "D"].includes(String(question.mode)) &&
    ["preflop", "flop", "turn"].includes(String(question.stage)) &&
    Array.isArray(question.board) &&
    question.board.every(isCard) &&
    typeof question.category === "string" &&
    typeof question.prompt === "string" &&
    typeof question.explain === "string" &&
    ["medium", "hard"].includes(String(question.difficulty)) &&
    typeof question.conceptKey === "string" &&
    isFiniteNumber(question.trueP) &&
    question.trueP >= 0 &&
    question.trueP <= 100 &&
    typeof question.distractorModel === "string" &&
    ["beginner", "intermediate", "advanced"].includes(String(question.level));
  if (!commonFieldsAreValid) return false;

  const hasHole = isHole(question.hole);
  const hasHands = isHands(question.hands);
  if (hasHole === hasHands) return false;

  if (question.answerType === "percent") {
    return (
      isPercentChoice(question.answer) &&
      isPercentChoice(question.distractor) &&
      question.answer !== question.distractor
    );
  }
  return (
    question.answerType === "hand" &&
    hasHands &&
    (question.answer === 0 || question.answer === 1) &&
    Array.isArray(question.equities) &&
    question.equities.length === 2 &&
    question.equities.every(isFiniteNumber)
  );
}

function isAnswerForQuestion(
  selected: unknown,
  question: Question,
): selected is QuestionAnswer {
  return question.answerType === "percent"
    ? isPercentChoice(selected)
    : selected === 0 || selected === 1;
}

function isQuizHistoryAnswer(value: unknown): value is QuizHistoryAnswer {
  if (!value || typeof value !== "object") return false;
  const answer = value as Partial<QuizHistoryAnswer>;
  if (
    !isQuestion(answer.question) ||
    !["correct", "wrong", "timeout"].includes(String(answer.outcome))
  ) {
    return false;
  }

  if (answer.outcome === "timeout") return answer.selected === null;
  if (!isAnswerForQuestion(answer.selected, answer.question)) return false;
  return answer.outcome === "correct"
    ? answer.selected === answer.question.answer
    : answer.selected !== answer.question.answer;
}

function hasValidSummary(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isFiniteNumber(value.completedAt) &&
    value.completedAt > 0 &&
    isInteger(value.score) &&
    isInteger(value.total) &&
    value.total > 0 &&
    value.score >= 0 &&
    value.score <= value.total &&
    isFiniteNumber(value.elapsedMs) &&
    value.elapsedMs >= 0 &&
    isFiniteNumber(value.timeLimitMs) &&
    value.timeLimitMs > 0 &&
    value.elapsedMs <= value.timeLimitMs &&
    isInteger(value.timeoutCount) &&
    value.timeoutCount >= 0 &&
    value.timeoutCount <= value.total - value.score
  );
}

function isQuizHistoryEntry(value: unknown): value is QuizHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as unknown as Record<string, unknown>;
  if (
    entry.version !== RESULT_HISTORY_VERSION ||
    !hasValidSummary(entry) ||
    !Array.isArray(entry.answers) ||
    !entry.answers.every(isQuizHistoryAnswer)
  ) {
    return false;
  }
  if (entry.answers.length === 0) return true;
  if (entry.answers.length !== entry.total) return false;
  const score = entry.answers.filter(
    (answer) => answer.outcome === "correct",
  ).length;
  const timeoutCount = entry.answers.filter(
    (answer) => answer.outcome === "timeout",
  ).length;
  return score === entry.score && timeoutCount === entry.timeoutCount;
}

function normalizeQuizHistoryEntry(value: unknown): QuizHistoryEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as unknown as Record<string, unknown>;
  if (entry.version === RESULT_HISTORY_VERSION) {
    return isQuizHistoryEntry(entry) ? entry : null;
  }
  if (
    entry.version !== LEGACY_RESULT_HISTORY_VERSION ||
    !hasValidSummary(entry)
  ) {
    return null;
  }
  return {
    version: RESULT_HISTORY_VERSION,
    id: entry.id as string,
    completedAt: entry.completedAt as number,
    score: entry.score as number,
    total: entry.total as number,
    elapsedMs: entry.elapsedMs as number,
    timeLimitMs: entry.timeLimitMs as number,
    timeoutCount: entry.timeoutCount as number,
    answers: [],
  };
}

function parseQuizHistory(value: string | null): QuizHistoryEntry[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeQuizHistoryEntry)
      .filter((entry): entry is QuizHistoryEntry => entry !== null)
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

function getOlderHistoryEntry(
  history: readonly QuizHistoryEntry[],
  currentId: string,
): QuizHistoryEntry | null {
  const currentIndex = history.findIndex((entry) => entry.id === currentId);
  return currentIndex >= 0 ? (history[currentIndex + 1] ?? null) : null;
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
    answers: result.answers ? [...result.answers] : [],
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
  getOlderHistoryEntry,
  isQuizHistoryAnswer,
  isQuizHistoryEntry,
  parseQuizHistory,
  readQuizHistory,
  saveQuizHistory,
};
export type {
  HistoryStorage,
  QuizHistoryAnswer,
  QuizHistoryEntry,
  QuizHistoryResult,
};
