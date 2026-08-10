<script lang="ts">
  import ActionButton from "../components/ActionButton.svelte";
  import MixedFontText from "../components/MixedFontText.svelte";
  import type { ReviewCompletionMessage } from "../review.ts";

  interface Props {
    message: ReviewCompletionMessage;
    onContinue: () => void;
    onHome: () => void;
  }

  let { message, onContinue, onHome }: Props = $props();
</script>

<section
  id="review-result"
  class="review-result-screen"
  aria-labelledby="review-result-title"
>
  <div class="review-result-content">
    <svg
      class="review-complete-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
      <path d="m9 11 3 3L22 4"></path>
    </svg>
    <div class="review-copy">
      <h2 id="review-result-title">
        {#each message as phrase, index (`${index}-${phrase}`)}
          <span class="review-message-phrase">
            <MixedFontText text={phrase} />
          </span>{#if index < message.length - 1}<wbr />{/if}
        {/each}
      </h2>
    </div>
  </div>

  <div class="review-result-actions">
    <ActionButton
      id="continue-after-review"
      label="問題を続ける"
      onClick={onContinue}
    />
    <ActionButton
      id="back-home-after-review"
      label="トップページに戻る"
      variant="secondary"
      onClick={onHome}
    />
  </div>
</section>

<style>
  .review-result-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: max(2rem, env(safe-area-inset-top)) var(--gutter)
      max(2rem, env(safe-area-inset-bottom));
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .review-result-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.8rem;
    width: 100%;
    padding-block: 1rem 2rem;
    text-align: center;
  }

  .review-complete-icon {
    width: clamp(6rem, 28vw, 8rem);
    height: auto;
    fill: none;
    color: #fff;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  .review-copy {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
  }

  .review-copy h2 {
    max-width: 24rem;
    color: var(--text);
    font-size: clamp(1.55rem, 7.2vw, 2.05rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.45;
    text-wrap: balance;
  }

  .review-message-phrase {
    white-space: nowrap;
  }

  .review-result-actions {
    display: grid;
    gap: 0.85rem;
    width: 100%;
  }
</style>
