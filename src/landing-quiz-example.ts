import type { Card, Hole, PercentChoice } from "./types.ts";

interface LandingQuizExample {
  prompt: string;
  hole: Hole;
  board: readonly Card[];
  target: "flush";
  choices: readonly [PercentChoice, PercentChoice];
  answer: PercentChoice;
  actualPercent: number;
}

const LANDING_QUIZ_EXAMPLE = Object.freeze({
  prompt: "フラッシュの確率は？",
  hole: ["6d", "9d"],
  board: ["8d", "Ad", "2s"],
  target: "flush",
  choices: ["35%", "20%"],
  answer: "35%",
  actualPercent: 35.0,
} satisfies LandingQuizExample);

export { LANDING_QUIZ_EXAMPLE };
export type { LandingQuizExample };
