<script lang="ts">
  import Board from "./Board.svelte";
  import ChoiceButton from "./ChoiceButton.svelte";
  import HoleCards from "./HoleCards.svelte";
  import { LANDING_QUIZ_EXAMPLE } from "../landing-quiz-example.ts";

  function ignorePreviewChoice(): void {
    return;
  }
</script>

<section class="quiz-example" aria-labelledby="quiz-example-title">
  <div class="quiz-challenge">
    <h2 id="quiz-example-title">
      この問題<wbr />すぐ答えられますか？
    </h2>

    <div class="quiz-preview">
      <p class="preview-prompt">{LANDING_QUIZ_EXAMPLE.prompt}</p>
      <div class="preview-cards">
        <Board cards={LANDING_QUIZ_EXAMPLE.board} revealKey="landing-example" />
        <HoleCards cards={LANDING_QUIZ_EXAMPLE.hole} />
      </div>
      <div class="preview-choices" aria-label="選択肢の例">
        {#each LANDING_QUIZ_EXAMPLE.choices as choice (choice)}
          <ChoiceButton
            value={choice}
            disabled
            onSelect={ignorePreviewChoice}
          />
        {/each}
      </div>
    </div>
  </div>

  <h2 class="preview-answer">
    答えは<strong>約{LANDING_QUIZ_EXAMPLE.answer}</strong><span
      >（{LANDING_QUIZ_EXAMPLE.actualPercent.toFixed(1)}%）</span
    >です
  </h2>
</section>

<style>
  .quiz-example {
    display: grid;
  }

  .quiz-challenge {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 100vh;
    min-height: 100dvh;
    padding-block: 3rem;
  }

  h2 {
    color: var(--text);
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 1.55;
    text-align: center;
  }

  .quiz-preview {
    display: grid;
    gap: 0.9rem;
    padding: 1.35rem 1rem 1.15rem;
    border: 1px solid rgb(255 255 255 / 14%);
    border-radius: 1.35rem;
    background:
      radial-gradient(
        circle at 50% 24%,
        rgb(15 139 109 / 36%),
        transparent 58%
      ),
      rgb(2 42 32 / 62%);
    box-shadow:
      inset 0 1px rgb(255 255 255 / 6%),
      0 1.1rem 2.5rem rgb(0 35 26 / 18%);
  }

  .preview-prompt {
    color: var(--text);
    font-size: clamp(1.1rem, 5vw, 1.35rem);
    font-weight: 700;
    line-height: 1.55;
    text-align: center;
  }

  .preview-cards {
    --card-reveal-duration: 0.01ms;
    display: grid;
    gap: 0.85rem;
  }

  .preview-choices {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    margin-top: 0.35rem;
    pointer-events: none;
  }

  .preview-answer {
    padding: 32px 0 240px 0;
    color: #dcebe5;
    font-weight: 650;
    line-height: 1.65;
    text-align: center;
  }

  .preview-answer strong {
    margin-inline: 0.3rem 0.15rem;
    color: var(--accent);
    font-size: clamp(1.55rem, 7vw, 1.9rem);
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .preview-answer span {
    color: var(--muted);
    font-size: 0.82em;
    white-space: nowrap;
  }
</style>
