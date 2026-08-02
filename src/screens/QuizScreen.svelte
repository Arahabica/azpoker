<script>
  import AnswerSheet from "../components/AnswerSheet.svelte";
  import Board from "../components/Board.svelte";
  import ChoiceButton from "../components/ChoiceButton.svelte";
  import HoleCards from "../components/HoleCards.svelte";
  import HandComparison from "../components/HandComparison.svelte";
  import MixedFontText from "../components/MixedFontText.svelte";
  import { CHOICE_REVEAL_DELAY_MS } from "../ui-timing.js";

  let {
    question,
    currentIndex,
    total,
    choices,
    answerResult,
    onLeave,
    onAnswer,
    onNext,
  } = $props();

  const progress = $derived(((currentIndex + 1) / total) * 100);
  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  let revealedChoiceIndex = $state(null);
  const choicesReady = $derived(revealedChoiceIndex === currentIndex);
  const choicesConcealed = $derived(!choicesReady || Boolean(answerResult));

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
</script>

<section
  id="game"
  class="game-screen"
  aria-labelledby="prompt"
>
  <header class="quiz-header">
    <button class="icon-button" type="button" aria-label="トップへ戻る" onclick={onLeave}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 5-7 7 7 7"></path>
      </svg>
    </button>
    <div
      class="progress-track"
      role="progressbar"
      aria-label="問題の進み具合"
      aria-valuemin="1"
      aria-valuemax={total}
      aria-valuenow={currentIndex + 1}
    >
      <span class="progress-fill" style={`width: ${progress}%`}></span>
    </div>
  </header>

  <div class="question-content">
    <h2 id="prompt" class="prompt" tabindex="-1">
      <MixedFontText text={question.prompt} />
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
          onSelect={onAnswer}
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
            onSelect={onAnswer}
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if answerResult}
    <AnswerSheet
      correct={answerResult.correct}
      {question}
      isLast={currentIndex === total - 1}
      {onNext}
    />
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
    padding:
      max(0.65rem, env(safe-area-inset-top))
      var(--gutter)
      max(1.15rem, env(safe-area-inset-bottom));
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .quiz-header {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
  }

  .icon-button {
    display: grid;
    flex: 0 0 2.75rem;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: rgb(255 255 255 / 78%);
    cursor: pointer;
  }

  .icon-button svg {
    width: 1.55rem;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2.3;
  }

  .progress-track {
    position: relative;
    flex: 1;
    height: 0.38rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgb(0 35 27 / 34%);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 14%);
  }

  .progress-fill {
    display: block;
    width: 10%;
    height: 100%;
    border-radius: inherit;
    background: var(--accent-emphasis);
    box-shadow: 0 0 0.7rem var(--accent-glow);
    transition: width 260ms ease;
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

  @media (hover: hover) {
    .icon-button:hover {
      background: rgb(0 39 30 / 24%);
      color: #fff;
    }
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
