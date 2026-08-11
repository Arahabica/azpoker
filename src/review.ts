import {
  createQuizHistoryEntry,
  type QuizHistoryAnswer,
  type QuizHistoryEntry,
} from "./result-history.ts";
import type { Difficulty, Question, RandomSource } from "./types.ts";

const RECENT_HISTORY_REVIEW_LIMIT = 10;

function randomIndex(length: number, random: RandomSource): number {
  const value = random();
  const normalized = Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 1 - Number.EPSILON)
    : 0;
  return Math.floor(normalized * length);
}

function recentWrongAnswers(
  history: readonly QuizHistoryEntry[],
): QuizHistoryAnswer[] {
  return history
    .slice(0, RECENT_HISTORY_REVIEW_LIMIT)
    .flatMap((entry) => entry.answers)
    .filter((answer) => answer.outcome !== "correct");
}

function getRecentMistakeQuestion(
  history: readonly QuizHistoryEntry[],
  random: RandomSource = Math.random,
): Question | null {
  const candidates = recentWrongAnswers(history).filter(
    ({ question }) => question.level !== "advanced",
  );
  if (candidates.length === 0) return null;
  return candidates[randomIndex(candidates.length, random)]!.question;
}

function createReviewSession(
  answers: readonly (QuizHistoryAnswer | null)[],
): Question[] {
  const seen = new Set<string>();
  const questions: Question[] = [];
  for (const answer of answers) {
    if (
      !answer ||
      answer.outcome === "correct" ||
      seen.has(answer.question.id)
    ) {
      continue;
    }
    seen.add(answer.question.id);
    questions.push(answer.question);
  }
  return questions;
}

function completeReviewHistoryEntry(
  entry: QuizHistoryEntry,
  reviewElapsedMs: number,
  reviewTimeLimitMs: number,
  completedAt = Date.now(),
): QuizHistoryEntry {
  return createQuizHistoryEntry(
    {
      id: entry.id,
      score: entry.score,
      total: entry.total,
      elapsedMs: entry.elapsedMs + reviewElapsedMs,
      timeLimitMs: entry.timeLimitMs + reviewTimeLimitMs,
      timeoutCount: entry.timeoutCount,
      answers: entry.answers,
    },
    completedAt,
  );
}

function formatDifficulty(difficulty: Difficulty): string {
  return difficulty === "hard" ? "むずかしい" : "ふつう";
}

export {
  RECENT_HISTORY_REVIEW_LIMIT,
  completeReviewHistoryEntry,
  createReviewSession,
  formatDifficulty,
  getRecentMistakeQuestion,
  recentWrongAnswers,
};
