<script lang="ts">
  import { formatActualPercent } from "../game.ts";
  import type { QuizHistoryAnswer } from "../result-history.ts";
  import type { AnswerResult } from "../types.ts";
  import Board from "./Board.svelte";
  import DifficultyBadge from "./DifficultyBadge.svelte";
  import HandComparison from "./HandComparison.svelte";
  import HoleCards from "./HoleCards.svelte";
  import MixedFontText from "./MixedFontText.svelte";

  interface Props {
    answer: QuizHistoryAnswer;
    index: number;
  }

  let { answer, index }: Props = $props();

  const question = $derived(answer.question);
  const answerResult = $derived<AnswerResult>({
    correct: answer.outcome === "correct",
    selected: answer.selected,
    timedOut: answer.outcome === "timeout",
  });
  const outcomeLabel = $derived(
    answer.outcome === "correct"
      ? "正解"
      : answer.outcome === "timeout"
        ? "時間切れ"
        : "不正解",
  );

  function ignoreSelection(): void {
    // 履歴では手札を選択できない。
  }
</script>

<article
  class="history-question"
  data-outcome={answer.outcome}
  aria-labelledby={`history-question-${index}`}
>
  <header class="question-meta">
    <span class="question-number">Q{index + 1}</span>
    <DifficultyBadge difficulty={question.difficulty} />
    <span class="outcome-badge">{outcomeLabel}</span>
  </header>

  <h2 id={`history-question-${index}`} class="history-prompt">
    <MixedFontText text={question.prompt} phraseWrap />
  </h2>

  <div class="history-table">
    <Board cards={question.board} revealKey={`history-${index}`} />
    {#if question.hands}
      <HandComparison
        hands={question.hands}
        disabled
        selectable={question.answerType === "hand"}
        {answerResult}
        answer={question.answer}
        targetHand={question.targetHand}
        onSelect={ignoreSelection}
      />
    {:else}
      <HoleCards cards={question.hole} />
    {/if}
  </div>

  {#if question.answerType === "percent"}
    <div class="history-choices" aria-label="回答した選択肢">
      {#each [question.answer, question.distractor] as choice (choice)}
        <div
          class="history-choice"
          class:is-correct={choice === question.answer}
          class:is-wrong={answer.selected === choice &&
            choice !== question.answer}
        >
          <span class="choice-value">約 {choice}</span>
          {#if choice === question.answer && answer.selected === choice}
            <span class="choice-note">あなたの回答・正解</span>
          {:else if choice === question.answer}
            <span class="choice-note">正解</span>
          {:else if answer.selected === choice}
            <span class="choice-note">あなたの回答</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="history-explanation">
    <p class="actual-probability">{formatActualPercent(question.trueP)}</p>
    <p class="explanation-label">解説</p>
    <p><MixedFontText text={question.explain} /></p>
  </div>
</article>

<style>
  .history-question {
    --card-reveal-duration: 0ms;
    display: grid;
    min-width: 0;
    gap: 1.15rem;
  }

  .question-meta {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: clamp(0.35rem, 2vw, 0.55rem);
  }

  .question-number {
    color: var(--text);
    font-size: 0.86rem;
    font-weight: 800;
    letter-spacing: 0.06em;
  }

  .outcome-badge {
    min-width: 3.7rem;
    padding: 0.28rem 0.55rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--wrong) 90%, transparent);
    color: var(--text);
    font-size: 0.72rem;
    font-weight: 800;
    text-align: center;
  }

  [data-outcome="correct"] .outcome-badge {
    background: color-mix(in srgb, var(--correct) 90%, transparent);
    color: var(--text);
  }

  .history-prompt {
    min-height: 2.9em;
    color: var(--text);
    font-size: clamp(1.16rem, 5.4vw, 1.45rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.45;
    text-align: center;
    text-wrap: balance;
  }

  .history-table {
    display: grid;
    gap: 1.1rem;
    padding-block: 0.2rem 0.4rem;
  }

  .history-table :global(.board) {
    min-height: clamp(4.25rem, 21vw, 6.2rem);
  }

  .history-table :global(.hand-card) {
    width: clamp(3.8rem, 19vw, 4.8rem);
  }

  .history-table :global(.hand-cards) {
    min-height: clamp(5.4rem, 25vw, 6.8rem);
  }

  .history-choices {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .history-choice {
    display: grid;
    min-height: 4rem;
    padding: 0.65rem 0.45rem;
    place-items: center;
    align-content: center;
    gap: 0.35rem;
    border: 2px solid rgb(255 255 255 / 16%);
    border-radius: 1rem;
    background: rgb(0 39 30 / 28%);
    text-align: center;
  }

  .history-choice.is-correct {
    border-color: var(--correct);
    background: rgb(44 187 132 / 15%);
  }

  .history-choice.is-wrong {
    border-color: var(--wrong);
    background: rgb(229 88 95 / 13%);
  }

  .choice-value {
    color: var(--text);
    font-size: 1.25rem;
    font-variant-numeric: tabular-nums;
  }

  .choice-note {
    color: var(--muted);
    font-size: 0.64rem;
    font-weight: 700;
    line-height: 1.35;
  }

  .history-explanation {
    display: grid;
    justify-items: center;
    gap: 0.45rem;
    padding: 1rem;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 1rem;
    background: rgb(0 31 24 / 34%);
    text-align: center;
  }

  .actual-probability {
    color: var(--accent-emphasis);
    font-size: clamp(2rem, 10vw, 2.7rem);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.055em;
    line-height: 1.1;
  }

  .explanation-label {
    margin-top: 0.25rem;
    color: var(--text);
    font-size: 0.72rem;
    font-weight: 800;
  }

  .history-explanation > p:last-child {
    color: #d1dfda;
    font-size: 0.86rem;
    line-height: 1.7;
    text-wrap: balance;
  }

  @media (max-width: 319px) {
    .history-table :global(.hand-option .hand-card) {
      width: 3.5rem;
    }
  }
</style>
