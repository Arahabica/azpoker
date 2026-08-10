<script lang="ts">
  import ActionButton from "../components/ActionButton.svelte";
  import MixedFontText from "../components/MixedFontText.svelte";
  import { getResultSummary } from "../result-summary.ts";

  interface Props {
    score: number;
    total: number;
    elapsedMs: number;
    timeLimitMs: number;
    timeoutCount: number;
    canReview: boolean;
    onRetry: () => void;
    onReview: () => void;
    onHome: () => void;
  }

  let {
    score,
    total,
    elapsedMs,
    timeLimitMs,
    timeoutCount,
    canReview,
    onRetry,
    onReview,
    onHome,
  }: Props = $props();

  const summary = $derived(
    getResultSummary({ score, total, elapsedMs, timeLimitMs, timeoutCount }),
  );
  const confettiColors = [
    "#f1c40f",
    "#ff6b6f",
    "#20ca91",
    "#f8f5ec",
    "#7d8cff",
  ];
  const confetti = Array.from({ length: 48 }, (_, index) => ({
    id: index,
    color: confettiColors[index % confettiColors.length],
    x: (index * 37) % 101,
    delay: (index % 12) * 70,
    duration: 2_500 + (index % 8) * 160,
    drift: ((index * 19) % 25) - 12,
    rotation: 360 + (index % 5) * 150,
    wide: index % 3 === 0,
  }));
</script>

<section
  id="result"
  class="result-screen"
  class:is-perfect={summary.perfect}
  aria-labelledby="result-title"
>
  {#if summary.perfect}
    <div class="confetti" aria-hidden="true">
      {#each confetti as piece (piece.id)}
        <span
          class="confetti-piece"
          class:is-wide={piece.wide}
          style={`--confetti-color: ${piece.color}; --confetti-x: ${piece.x}%; --confetti-delay: ${piece.delay}ms; --confetti-duration: ${piece.duration}ms; --confetti-drift: ${piece.drift}vw; --confetti-rotation: ${piece.rotation}deg;`}
        ></span>
      {/each}
    </div>
  {/if}

  <div class="result-content">
    {#if summary.perfect}
      <div class="perfect-crown" aria-hidden="true">
        <svg viewBox="0 0 64 56">
          <path d="M8 17 21 29 32 9l11 20 13-12-5 28H13L8 17Z"></path>
          <path d="M15 49h34"></path>
        </svg>
      </div>
    {/if}

    <h2 id="result-title">{summary.headline}</h2>

    <div class="result-stats">
      <div class="result-stat">
        <p class="stat-value">
          <MixedFontText text={summary.scoreLabel} />
        </p>
        <p class="stat-caption">
          <MixedFontText text={summary.totalLabel} />
        </p>
      </div>
      <span class="stat-divider" aria-hidden="true"></span>
      <div class="result-stat">
        <p class="stat-value">
          <MixedFontText text={summary.elapsedLabel} />
        </p>
        <p class="stat-caption">
          <MixedFontText text={summary.limitLabel} />
        </p>
        {#if summary.timeoutLabel}
          <p class="timeout-count">
            <MixedFontText text={summary.timeoutLabel} />
          </p>
        {/if}
      </div>
    </div>
  </div>
  <div class="result-actions">
    <ActionButton id="retry" label="問題を続ける" onClick={onRetry} />
    {#if canReview}
      <ActionButton
        id="review-wrong-answers"
        label="復習する"
        variant="secondary"
        onClick={onReview}
      />
    {/if}
    <ActionButton
      id="back-home"
      label="トップページに戻る"
      variant="secondary"
      onClick={onHome}
    />
  </div>
</section>

<style>
  .result-screen {
    position: relative;
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

  .result-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(1.4rem, 5vh, 2.3rem);
    width: 100%;
    padding-block: 1rem 2rem;
    text-align: center;
  }

  .result-content h2 {
    max-width: 24rem;
    color: var(--text);
    font-size: clamp(1.55rem, 7.2vw, 2.05rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.45;
    text-wrap: balance;
  }

  .is-perfect .result-content h2 {
    color: #ffe45e;
    text-shadow: 0 0 1.4rem rgb(241 196 15 / 42%);
  }

  .perfect-crown {
    display: grid;
    width: clamp(5.4rem, 22vw, 7rem);
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgb(255 228 94 / 42%);
    border-radius: 50%;
    background:
      radial-gradient(
        circle at 50% 38%,
        rgb(255 242 157 / 22%),
        transparent 56%
      ),
      rgb(31 85 65 / 72%);
    box-shadow:
      0 0 0 0.45rem rgb(241 196 15 / 8%),
      0 0.9rem 2.4rem rgb(0 34 25 / 32%);
  }

  .perfect-crown svg {
    width: 62%;
    fill: var(--accent);
    stroke: #fff0a4;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  .result-stats {
    display: grid;
    width: min(100%, 22rem);
    padding: 1.25rem 1.4rem;
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 1.35rem;
    background: rgb(2 42 32 / 52%);
    box-shadow:
      inset 0 1px rgb(255 255 255 / 5%),
      0 1rem 2.4rem rgb(0 35 26 / 18%);
  }

  .is-perfect .result-stats {
    border-color: rgb(241 196 15 / 34%);
    background: rgb(30 65 48 / 66%);
  }

  .result-stat {
    display: grid;
    gap: 0.25rem;
  }

  .stat-value {
    color: var(--text);
    font-size: clamp(2rem, 10vw, 2.7rem);
    font-weight: 400;
    letter-spacing: -0.055em;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0.35rem 1.2rem rgb(0 38 29 / 22%);
  }

  .stat-caption {
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .timeout-count {
    margin-top: 0.35rem;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .stat-divider {
    width: 100%;
    height: 1px;
    margin-block: 1rem;
    background: rgb(255 255 255 / 10%);
  }

  .result-actions {
    position: relative;
    z-index: 2;
    display: grid;
    flex: 0 0 auto;
    gap: 0.85rem;
    width: 100%;
  }

  .confetti {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
  }

  .confetti-piece {
    position: absolute;
    top: -8%;
    left: var(--confetti-x);
    width: 0.42rem;
    height: 0.76rem;
    border-radius: 0.08rem;
    background: var(--confetti-color);
    opacity: 0;
    box-shadow: 0 0.2rem 0.35rem rgb(0 0 0 / 14%);
    animation: confetti-fall var(--confetti-duration) ease-in
      var(--confetti-delay) both;
  }

  .confetti-piece.is-wide {
    width: 0.7rem;
    height: 0.42rem;
  }

  @keyframes confetti-fall {
    0% {
      opacity: 0;
      transform: translate3d(0, -8vh, 0) rotate(0deg);
    }

    8% {
      opacity: 1;
    }

    100% {
      opacity: 0.9;
      transform: translate3d(var(--confetti-drift), 112vh, 0)
        rotate(var(--confetti-rotation));
    }
  }

  @media (max-height: 650px) {
    .result-content {
      gap: 1rem;
      padding-block: 0.4rem 1rem;
    }

    .perfect-crown {
      width: 4.6rem;
    }

    .result-stats {
      padding-block: 0.9rem;
    }

    .stat-divider {
      margin-block: 0.7rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .confetti {
      display: none;
    }
  }
</style>
