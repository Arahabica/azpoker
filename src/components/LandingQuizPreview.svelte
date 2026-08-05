<script lang="ts">
  import Board from "./Board.svelte";
  import ChoiceButton from "./ChoiceButton.svelte";
  import HoleCards from "./HoleCards.svelte";
  import type { Card, PercentChoice } from "../types.ts";

  const EXAMPLE_BOARD: readonly Card[] = ["8d", "Ad", "2s"];
  const EXAMPLE_HOLE: readonly Card[] = ["6d", "9d"];
  const EXAMPLE_CHOICES: readonly PercentChoice[] = ["35%", "20%"];

  function ignorePreviewChoice(): void {
    return;
  }
</script>

<section class="quiz-example" aria-labelledby="quiz-example-title">
  <h2 id="quiz-example-title">
    この問題<wbr />すぐ答えられますか？
  </h2>

  <div class="quiz-preview">
    <p class="preview-prompt">フラッシュの確率は？</p>
    <div class="preview-cards">
      <Board cards={EXAMPLE_BOARD} revealKey="landing-example" />
      <HoleCards cards={EXAMPLE_HOLE} />
    </div>
    <div class="preview-choices" aria-label="選択肢の例">
      {#each EXAMPLE_CHOICES as choice (choice)}
        <ChoiceButton value={choice} disabled onSelect={ignorePreviewChoice} />
      {/each}
    </div>
  </div>

  <p class="question-count">収録問題数 <strong>2万問！</strong></p>
</section>

<style>
  .quiz-example {
    display: grid;
    gap: 1.5rem;
  }

  h2 {
    color: var(--text);
    font-size: 28px;
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
    gap: 0.15rem;
  }

  .preview-choices {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    pointer-events: none;
  }

  .question-count {
    color: #dcebe5;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.4;
    text-align: center;
  }

  .question-count strong {
    color: var(--accent);
    font-size: 1.65rem;
    font-weight: 800;
    letter-spacing: -0.04em;
  }
</style>
