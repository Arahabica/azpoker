export type RandomSource = () => number;

export type Suit = "c" | "d" | "h" | "s";
export type SourceRank =
  "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";
export type DisplayRank = Exclude<SourceRank, "T"> | "10";
export type Card = `${SourceRank}${Suit}`;
export type Hole = readonly [Card, Card];
export type Hands = readonly [Hole, Hole];

export type GameMode = "A" | "B" | "C" | "D";
export type Stage = "preflop" | "flop" | "turn";
export type Difficulty = "medium" | "hard";
export type PercentChoice = `${number}%`;
export type HandIndex = 0 | 1;
export type QuestionAnswer = PercentChoice | HandIndex;
export type QuestionOutcome = "correct" | "wrong" | "timeout";
export type SoundName =
  "start" | "correct" | "wrong" | "warning" | "complete" | "perfect";

interface QuestionBase {
  id: string;
  mode: GameMode;
  stage: Stage;
  board: readonly Card[];
  category: string;
  prompt: string;
  explain: string;
  difficulty: Difficulty;
  conceptKey: string;
  trueP: number;
  distractorModel: string;
  target?: string;
  targetRank?: SourceRank;
  targetSuit?: Suit;
  targetHand?: HandIndex;
  playerCount?: 2 | 6;
}

interface HoleLayout {
  hole: Hole;
  hands?: never;
}

interface HandsLayout {
  hands: Hands;
  hole?: never;
}

interface PercentAnswer {
  answerType: "percent";
  answer: PercentChoice;
  distractor: PercentChoice;
}

interface HandAnswer {
  answerType: "hand";
  answer: HandIndex;
  distractor?: never;
  equities: readonly [number, number];
}

export type Question =
  | (QuestionBase & HoleLayout & PercentAnswer)
  | (QuestionBase & HandsLayout & PercentAnswer)
  | (QuestionBase & HandsLayout & HandAnswer);

export interface AnswerResult {
  correct: boolean;
  selected: QuestionAnswer | null;
  timedOut: boolean;
}

export interface QuestionManifest {
  version: string;
  total: number;
  batchSize: number;
  modes: Record<GameMode, { count: number }>;
  groups: Record<
    "A" | "BC" | "D",
    {
      count: number;
      files: number;
      path: string;
    }
  >;
}
