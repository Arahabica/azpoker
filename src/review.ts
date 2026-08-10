import type { QuizHistoryAnswer, QuizHistoryEntry } from "./result-history.ts";
import type { Difficulty, Question, RandomSource } from "./types.ts";

const RECENT_HISTORY_REVIEW_LIMIT = 10;
type ReviewCompletionMessage = readonly [string, ...string[]];

const REVIEW_COMPLETION_MESSAGES = [
  ["復習", "お疲れ様でした！"],
  ["復習完了！", "また一歩", "強くなりました！"],
  ["間違いを", "力に変えました！"],
  ["苦手な問題を", "しっかり克服しました！"],
  ["いい復習でした！", "次もこの調子！"],
  ["すべて正解！", "よくできました！"],
  ["もう一度向き合った分だけ", "強くなりました！"],
  ["間違いにしっかり", "向き合えました！"],
  ["復習完了！", "次の問題へ", "進もう！"],
  ["すべて", "解き直せました！"],
  ["復習で大きく", "前進しました！"],
  ["迷った問題も、", "もう大丈夫！"],
] as const satisfies readonly ReviewCompletionMessage[];

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
): ReviewCompletionMessage {
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
export type { ReviewCompletionMessage };
