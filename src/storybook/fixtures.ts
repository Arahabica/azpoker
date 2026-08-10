import {
  createQuizHistoryEntry,
  type QuizHistoryAnswer,
  type QuizHistoryEntry,
} from "../result-history.ts";
import type { Question } from "../types.ts";

const FIXED_FUTURE_DATE = Date.UTC(2100, 0, 1);

const percentQuestion = {
  id: "storybook-percent-flush",
  mode: "A",
  stage: "flop",
  hole: ["Ah", "Kh"],
  board: ["Qh", "2c", "7d"],
  category: "flush",
  prompt: "リバーまでにフラッシュになる確率は？",
  explain: "同じマークがあと1枚出れば、フラッシュが完成します。",
  difficulty: "medium",
  conceptKey: "storybook:flush-draw",
  trueP: 34.97,
  distractorModel: "残り1枚だけで計算する",
  level: "beginner",
  answerType: "percent",
  answer: "35%",
  distractor: "20%",
} as const satisfies Question;

const handQuestion = {
  id: "storybook-hand-comparison",
  mode: "D",
  stage: "flop",
  hands: [
    ["Ah", "Kh"],
    ["Qs", "Qd"],
  ],
  board: ["Qh", "2c", "7d"],
  category: "hand-comparison",
  prompt: "どちらの手札が勝ちやすい？",
  explain: "右の手札はスリーカードですが、左の手札にも強い引きがあります。",
  difficulty: "hard",
  conceptKey: "storybook:hand-comparison",
  trueP: 55.4,
  distractorModel: "完成している役だけで判断する",
  level: "advanced",
  answerType: "hand",
  answer: 0,
  equities: [55.4, 44.6],
  targetHand: 1,
} as const satisfies Question;

const wrongPercentAnswer: QuizHistoryAnswer = {
  question: percentQuestion,
  outcome: "wrong",
  selected: "20%",
};

const correctHandAnswer: QuizHistoryAnswer = {
  question: handQuestion,
  outcome: "correct",
  selected: 0,
};

const historyDetailEntry = createQuizHistoryEntry(
  {
    id: "storybook-history-detail",
    score: 1,
    total: 2,
    elapsedMs: 8_400,
    timeLimitMs: 24_000,
    timeoutCount: 0,
    answers: [wrongPercentAnswer, correctHandAnswer],
  },
  FIXED_FUTURE_DATE,
);

const timeoutHistoryEntry = createQuizHistoryEntry(
  {
    id: "storybook-history-timeout",
    score: 0,
    total: 1,
    elapsedMs: 8_000,
    timeLimitMs: 8_000,
    timeoutCount: 1,
    answers: [
      {
        question: percentQuestion,
        outcome: "timeout",
        selected: null,
      },
    ],
  },
  FIXED_FUTURE_DATE - 1,
);

const historyEntries: readonly QuizHistoryEntry[] = [
  historyDetailEntry,
  timeoutHistoryEntry,
];

export { handQuestion, historyDetailEntry, historyEntries, percentQuestion };
