<script>
  import AnswerSheet from "../components/AnswerSheet.svelte";
  import ChoiceButton from "../components/ChoiceButton.svelte";
  import MixedFontText from "../components/MixedFontText.svelte";
  import PlayingCard from "../components/PlayingCard.svelte";

  let {
    question,
    currentIndex,
    total,
    visibleBoard,
    choices,
    choicesReady,
    answerResult,
    onLeave,
    onAnswer,
    onNext,
  } = $props();

  const progress = $derived(((currentIndex + 1) / total) * 100);
</script>

<section
  id="game"
  class="screen game-screen"
  data-phase={answerResult ? "answer" : "question"}
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
      <div class="board-lane" role="group" aria-label="コミュニティカード">
        {#each visibleBoard as card, index (`${card}-${index}`)}
          <PlayingCard
            {card}
            {index}
            variant="board"
            isNew={index === 3 && visibleBoard.length === 4}
          />
        {/each}
      </div>

      <section class="hand-area" aria-labelledby="hole-label">
        <div class="hand-cards" role="group" aria-label="手札">
          {#each question.hole as card, index (card)}
            <PlayingCard {card} {index} variant="hole" />
          {/each}
        </div>
        <p id="hole-label" class="hand-label">手札</p>
      </section>
    </div>

    <div
      class="choices"
      class:is-concealed={Boolean(answerResult)}
      aria-label="選択肢"
      hidden={!choicesReady}
    >
      {#each choices as choice (choice)}
        <ChoiceButton
          value={choice}
          disabled={Boolean(answerResult)}
          onSelect={onAnswer}
        />
      {/each}
    </div>
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
