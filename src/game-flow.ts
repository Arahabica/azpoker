import type { AnswerResult, QuestionAnswer } from "./types.ts";

type GameFlowState =
  | { status: "top" }
  | { status: "preparing" }
  | { status: "ready"; totalQuestions: number }
  | { status: "preparation-error"; message: string }
  | { status: "answering"; questionIndex: number; totalQuestions: number }
  | {
      status: "answered";
      questionIndex: number;
      totalQuestions: number;
      answerResult: AnswerResult;
    }
  | { status: "result"; totalQuestions: number };

type GameFlowEvent =
  | { type: "START_PREPARATION" }
  | { type: "PREPARATION_SUCCEEDED"; totalQuestions: number }
  | { type: "PREPARATION_FAILED"; message: string }
  | { type: "START_SESSION" }
  | { type: "START_REVIEW"; totalQuestions: number }
  | {
      type: "ANSWER";
      questionIndex: number;
      correct: boolean;
      selected: QuestionAnswer;
    }
  | { type: "TIMEOUT"; questionIndex: number }
  | { type: "NEXT_QUESTION"; repeatCurrent?: boolean }
  | { type: "LEAVE" };

function createInitialGameFlow(): GameFlowState {
  return { status: "top" };
}

function hasQuestions(totalQuestions: number): boolean {
  return Number.isInteger(totalQuestions) && totalQuestions > 0;
}

function canStartPreparation(state: GameFlowState): boolean {
  return (
    state.status === "top" ||
    state.status === "preparation-error" ||
    state.status === "result"
  );
}

function transitionGameFlow(
  state: GameFlowState,
  event: GameFlowEvent,
): GameFlowState {
  switch (event.type) {
    case "START_PREPARATION":
      return canStartPreparation(state) ? { status: "preparing" } : state;

    case "PREPARATION_SUCCEEDED":
      return state.status === "preparing" && hasQuestions(event.totalQuestions)
        ? { status: "ready", totalQuestions: event.totalQuestions }
        : state;

    case "PREPARATION_FAILED":
      return state.status === "preparing"
        ? { status: "preparation-error", message: event.message }
        : state;

    case "START_SESSION":
      return state.status === "ready"
        ? {
            status: "answering",
            questionIndex: 0,
            totalQuestions: state.totalQuestions,
          }
        : state;

    case "START_REVIEW":
      return state.status === "result" && hasQuestions(event.totalQuestions)
        ? {
            status: "answering",
            questionIndex: 0,
            totalQuestions: event.totalQuestions,
          }
        : state;

    case "ANSWER":
      return state.status === "answering" &&
        state.questionIndex === event.questionIndex
        ? {
            status: "answered",
            questionIndex: state.questionIndex,
            totalQuestions: state.totalQuestions,
            answerResult: {
              correct: event.correct,
              selected: event.selected,
              timedOut: false,
            },
          }
        : state;

    case "TIMEOUT":
      return state.status === "answering" &&
        state.questionIndex === event.questionIndex
        ? {
            status: "answered",
            questionIndex: state.questionIndex,
            totalQuestions: state.totalQuestions,
            answerResult: {
              correct: false,
              selected: null,
              timedOut: true,
            },
          }
        : state;

    case "NEXT_QUESTION": {
      if (state.status !== "answered") {
        return state;
      }
      const nextTotal =
        state.totalQuestions + (event.repeatCurrent === true ? 1 : 0);
      return state.questionIndex >= nextTotal - 1
        ? { status: "result", totalQuestions: nextTotal }
        : {
            status: "answering",
            questionIndex: state.questionIndex + 1,
            totalQuestions: nextTotal,
          };
    }

    case "LEAVE":
      return state.status === "top" ? state : createInitialGameFlow();
  }
}

function getQuestionIndex(state: GameFlowState): number | null {
  return state.status === "answering" || state.status === "answered"
    ? state.questionIndex
    : null;
}

function getAnswerResult(state: GameFlowState): AnswerResult | null {
  return state.status === "answered" ? state.answerResult : null;
}

function getPreparationError(state: GameFlowState): string {
  return state.status === "preparation-error" ? state.message : "";
}

export {
  createInitialGameFlow,
  getAnswerResult,
  getPreparationError,
  getQuestionIndex,
  transitionGameFlow,
};
export type { GameFlowEvent, GameFlowState };
