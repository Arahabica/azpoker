<script lang="ts">
  import ActionButton from "../components/ActionButton.svelte";

  interface Props {
    message: string;
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
    <div class="review-complete-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="25"></circle>
        <path d="m20 32 8 8 17-19"></path>
      </svg>
    </div>
    <div class="review-copy">
      <h2 id="review-result-title">
        {message || "復習お疲れ様でした！"}
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

  .review-complete-mark {
    display: grid;
    width: clamp(5.4rem, 22vw, 7rem);
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgb(32 202 145 / 48%);
    border-radius: 50%;
    background:
      radial-gradient(circle, rgb(32 202 145 / 20%), transparent 67%),
      rgb(2 42 32 / 55%);
    box-shadow:
      0 0 0 0.45rem rgb(32 202 145 / 8%),
      0 0.9rem 2.4rem rgb(0 34 25 / 32%);
  }

  .review-complete-mark svg {
    width: 72%;
    fill: none;
    stroke: var(--correct);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
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

  .review-result-actions {
    display: grid;
    gap: 0.85rem;
    width: 100%;
  }
</style>
