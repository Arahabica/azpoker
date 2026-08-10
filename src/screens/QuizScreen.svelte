<script lang="ts">
  import AnswerSheet from "../components/AnswerSheet.svelte";
  import Board from "../components/Board.svelte";
  import ChoiceButton from "../components/ChoiceButton.svelte";
  import DifficultyBadge from "../components/DifficultyBadge.svelte";
  import HoleCards from "../components/HoleCards.svelte";
  import HandComparison from "../components/HandComparison.svelte";
  import LeaveConfirmationSheet from "../components/LeaveConfirmationSheet.svelte";
  import MixedFontText from "../components/MixedFontText.svelte";
  import QuizProgressTimer from "../components/QuizProgressTimer.svelte";
  import { getQuestionTimeLimitMs } from "../question-timer.ts";
  import { CHOICE_REVEAL_DELAY_MS } from "../ui-timing.ts";
  import type {
    AnswerResult,
    PercentChoice,
    Question,
    QuestionAnswer,
    QuestionOutcome,
  } from "../types.ts";

  interface Props {
    question: Question;
    currentIndex: number;
    total: number;
    choices: readonly PercentChoice[];
    answerResult: AnswerResult | null;
    outcomes: readonly (QuestionOutcome | null)[];
    reviewMode?: boolean;
    onLeave: () => void;
    onAnswer: (selected: QuestionAnswer, elapsedMs: number) => void;
    onTimeWarning: (questionIndex: number) => void;
    onTimeout: (questionIndex: number, elapsedMs: number) => void;
    onNext: () => void;
  }

  let {
    question,
    currentIndex,
    total,
    choices,
    answerResult,
    outcomes,
    reviewMode = false,
    onLeave,
    onAnswer,
    onTimeWarning,
    onTimeout,
    onNext,
  }: Props = $props();

  const durationMs = $derived(getQuestionTimeLimitMs(question));
  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  let revealedChoiceIndex = $state<number | null>(null);
  let questionStartedAt = $state(0);
  let questionStartedForIndex = $state(-1);
  let leaveConfirmationOpen = $state(false);
  const choicesReady = $derived(revealedChoiceIndex === currentIndex);
  const choicesConcealed = $derived(!choicesReady || Boolean(answerResult));
  const showsResultNext = $derived(
    currentIndex === total - 1 &&
      answerResult?.correct === true &&
      (reviewMode || outcomes.every((outcome) => outcome === "correct")),
  );

  $effect(() => {
    const questionIndex = currentIndex;
    const shouldDelayChoices = question.board.length > 0 && !reducedMotion;

    if (!shouldDelayChoices) {
      revealedChoiceIndex = questionIndex;
      return;
    }

    revealedChoiceIndex = null;
    const timer = window.setTimeout(() => {
      revealedChoiceIndex = questionIndex;
    }, CHOICE_REVEAL_DELAY_MS);

    return () => window.clearTimeout(timer);
  });

  $effect(() => {
    const questionIndex = currentIndex;
    leaveConfirmationOpen = false;

    if (!choicesReady || answerResult || typeof performance === "undefined") {
      questionStartedAt = 0;
      questionStartedForIndex = -1;
      return;
    }

    questionStartedForIndex = questionIndex;
    questionStartedAt = performance.now();
  });

  function getElapsedMs(): number {
    if (
      questionStartedForIndex !== currentIndex ||
      !questionStartedAt ||
      typeof performance === "undefined"
    )
      return 0;
    return Math.min(
      durationMs,
      Math.max(0, performance.now() - questionStartedAt),
    );
  }

  function handleAnswer(selected: QuestionAnswer): void {
    onAnswer(selected, getElapsedMs());
  }

  function handleQuestionTimeout(questionIndex: number): void {
    onTimeout(questionIndex, durationMs);
  }

  function requestLeave(): void {
    leaveConfirmationOpen = true;
  }

  function continueQuiz(): void {
    leaveConfirmationOpen = false;
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>("#leave-quiz")
        ?.focus({ preventScroll: true });
    });
  }
</script>

<section id="game" class="game-screen" aria-labelledby="prompt">
  <header class="quiz-header">
    {#if reviewMode}
      <div class="review-context">
        <span class="review-label">復習</span>
        <DifficultyBadge difficulty={question.difficulty} />
      </div>
    {/if}
    <QuizProgressTimer
      {currentIndex}
      {total}
      {outcomes}
      {durationMs}
      running={choicesReady && !answerResult}
      onWarning={onTimeWarning}
      onTimeout={handleQuestionTimeout}
    />
  </header>

  <div class="question-content">
    <h2 id="prompt" class="prompt" tabindex="-1">
      <MixedFontText text={question.prompt} phraseWrap />
    </h2>

    <div class="table-area">
      <Board cards={question.board} revealKey={currentIndex} />
      {#if question.hands}
        <HandComparison
          hands={question.hands}
          disabled={choicesConcealed}
          selectable={question.answerType === "hand"}
          {answerResult}
          answer={question.answer}
          targetHand={question.targetHand}
          onSelect={handleAnswer}
        />
      {:else}
        <HoleCards cards={question.hole} />
      {/if}
    </div>

    {#if question.answerType === "percent"}
      <div
        class="choices"
        class:is-concealed={choicesConcealed}
        aria-label="選択肢"
        aria-hidden={choicesConcealed}
      >
        {#each choices as choice (choice)}
          <ChoiceButton
            value={choice}
            disabled={choicesConcealed}
            onSelect={handleAnswer}
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if answerResult}
    <AnswerSheet
      correct={answerResult.correct}
      timedOut={answerResult.timedOut}
      {question}
      isLast={showsResultNext}
      blocked={leaveConfirmationOpen}
      {onNext}
      onRequestLeave={requestLeave}
    />
    {#if leaveConfirmationOpen}
      <LeaveConfirmationSheet
        onConfirmLeave={onLeave}
        onContinue={continueQuiz}
      />
    {/if}
  {/if}
</section>

<style>
  .game-screen {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: max(0.65rem, env(safe-area-inset-top)) var(--gutter)
      max(1.15rem, env(safe-area-inset-bottom));
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .quiz-header {
    display: grid;
    flex: 0 0 auto;
    align-content: center;
    gap: 0.6rem;
    min-height: 2.75rem;
  }

  .review-context {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .review-label {
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .question-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .prompt {
    display: grid;
    min-height: 3.2em;
    margin: clamp(1.2rem, 4.5vh, 2.4rem) 0 0.3rem;
    place-items: center;
    color: var(--text);
    font-size: clamp(1.3rem, 6.2vw, 1.7rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.45;
    text-align: center;
    text-wrap: balance;
  }

  .prompt:focus {
    outline: none;
  }

  .table-area {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-height: 15.5rem;
    padding: 0.5rem 0 0.7rem;
    gap: clamp(1.5rem, 4.8vh, 2.7rem);
  }

  .choices {
    display: grid;
    flex: 0 0 auto;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    width: 100%;
    padding-top: 0.65rem;
  }

  .choices.is-concealed {
    visibility: hidden;
    pointer-events: none;
  }

  @media (max-height: 620px) {
    .prompt {
      margin-top: 0.6rem;
      min-height: 2.6em;
    }

    .table-area {
      min-height: 13.5rem;
      gap: 1rem;
      padding-block: 0.1rem;
    }
  }
</style>
