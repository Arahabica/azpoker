<script lang="ts">
  import HoleCards from "./HoleCards.svelte";
  import type {
    AnswerResult,
    HandIndex,
    Hands,
    QuestionAnswer,
  } from "../types.ts";

  interface Props {
    hands: Hands;
    disabled?: boolean;
    selectable?: boolean;
    answerResult?: AnswerResult | null;
    answer: QuestionAnswer;
    onSelect: (index: HandIndex) => void;
  }

  let {
    hands,
    disabled = false,
    selectable = true,
    answerResult = null,
    answer,
    onSelect,
  }: Props = $props();

  function selectHand(index: number): void {
    if (index === 0 || index === 1) onSelect(index);
  }
</script>

<div class="hand-options" aria-label="選択肢">
  {#each hands as hand, index}
    {#if selectable}
      <button
        type="button"
        class="hand-option"
        class:is-correct={Boolean(answerResult) && index === answer}
        class:is-wrong={answerResult?.selected === index && index !== answer}
        aria-label={`${index + 1}つ目の手札`}
        {disabled}
        onclick={() => selectHand(index)}
      >
        <HoleCards cards={hand} />
      </button>
    {:else}
      <div class="hand-option static-hand" aria-label={`${index + 1}つ目の手札`}>
        <HoleCards cards={hand} />
      </div>
    {/if}
  {/each}
</div>

<style>
  .hand-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    width: 100%;
  }

  .hand-option {
    min-width: 0;
    padding: 0.55rem 0.15rem;
    border: 2px solid rgb(255 255 255 / 18%);
    border-radius: 1rem;
    background: rgb(0 39 30 / 28%);
    cursor: pointer;
  }

  .hand-option:disabled {
    cursor: default;
  }

  .static-hand {
    cursor: default;
  }

  .hand-option.is-correct {
    border-color: var(--correct);
    background: rgb(44 187 132 / 15%);
  }

  .hand-option.is-wrong {
    border-color: var(--wrong);
    background: rgb(229 88 95 / 13%);
  }

  .hand-option :global(.hand-card) {
    width: clamp(3.85rem, 18vw, 4.85rem);
  }

  .hand-option :global(.hand-cards) {
    min-height: clamp(5.5rem, 25vw, 7rem);
  }

  @media (hover: hover) {
    .hand-option:not(:disabled):hover {
      border-color: var(--accent-emphasis);
    }
  }
</style>
