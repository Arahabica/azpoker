import type { QuizHistoryAnswer, QuizHistoryEntry } from "./result-history.ts";
import type { Difficulty, Question, RandomSource } from "./types.ts";

const RECENT_HISTORY_REVIEW_LIMIT = 10;
const REVIEW_COMPLETION_MESSAGES = Object.freeze([
  "復習お疲れ様でした！",
  "復習完了！また一歩強くなりました！",
  "間違いを力に変えました！",
  "苦手な問題をしっかり克服しました！",
  "いい復習でした！次もこの調子！",
  "復習ばっちり！また強くなりました！",
  "すべて正解！よくできました！",
  "もう一度向き合った分だけ強くなりました！",
  "間違いにしっかり向き合えました！",
  "復習完了！次の問題へ進もう！",
  "苦手な問題にしっかり勝てました！",
  "すべて解き直せました！",
  "復習で大きく前進しました！",
  "迷った問題も、もう大丈夫！",
]);

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

function addRecentMistakeToSession(
  session: readonly Question[],
  history: readonly QuizHistoryEntry[],
  random: RandomSource = Math.random,
): Question[] {
  const sessionIds = new Set(session.map((question) => question.id));
  const candidates = recentWrongAnswers(history).filter(
    ({ question }) => !sessionIds.has(question.id),
  );
  if (candidates.length === 0) return [...session];
  const picked = candidates[randomIndex(candidates.length, random)]!;
  return [...session, picked.question];
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

function getReviewCompletionMessage(
  random: RandomSource = Math.random,
): string {
  return REVIEW_COMPLETION_MESSAGES[
    randomIndex(REVIEW_COMPLETION_MESSAGES.length, random)
  ]!;
}

function formatDifficulty(difficulty: Difficulty): string {
  return difficulty === "hard" ? "むずかしい" : "ふつう";
}

export {
  RECENT_HISTORY_REVIEW_LIMIT,
  REVIEW_COMPLETION_MESSAGES,
  addRecentMistakeToSession,
  createReviewSession,
  formatDifficulty,
  getReviewCompletionMessage,
  recentWrongAnswers,
};
