<script lang="ts">
  import { onMount, tick } from "svelte";

  import ActionButton from "../components/ActionButton.svelte";
  import MixedFontText from "../components/MixedFontText.svelte";
  import PerfectConfetti from "../components/PerfectConfetti.svelte";
  import { getResultSummary } from "../result-summary.ts";
  import {
    PERFECT_RESULT_REVEAL_DELAY_MS,
    PERFECT_SPOTLIGHT_DELAY_MS,
  } from "../ui-timing.ts";

  interface Props {
    score: number;
    total: number;
    elapsedMs: number;
    timeLimitMs: number;
    timeoutCount: number;
    onRetry: () => void;
    onHome: () => void;
  }

  let {
    score,
    total,
    elapsedMs,
    timeLimitMs,
    timeoutCount,
    onRetry,
    onHome,
  }: Props = $props();

  const summary = $derived(
    getResultSummary({ score, total, elapsedMs, timeLimitMs, timeoutCount }),
  );
  type PerfectStage = "waiting" | "spotlight" | "revealed";
  let perfectStage = $state<PerfectStage>("waiting");
  const resultRevealed = $derived(
    !summary.perfect || perfectStage === "revealed",
  );
  const spotlightVisible = $derived(
    summary.perfect && perfectStage !== "waiting",
  );
  let resultTitleElement = $state<HTMLElement>();

  function focusPerfectHeadline(): void {
    void tick().then(() => {
      window.requestAnimationFrame(() => {
        resultTitleElement?.focus({ preventScroll: true });
      });
    });
  }

  function revealPerfectResult(): void {
    perfectStage = "revealed";
    focusPerfectHeadline();
  }

  onMount(() => {
    if (!summary.perfect) return;
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      revealPerfectResult();
      return;
    }

    const spotlightTimer = window.setTimeout(() => {
      perfectStage = "spotlight";
    }, PERFECT_SPOTLIGHT_DELAY_MS);
    const revealTimer = window.setTimeout(
      revealPerfectResult,
      PERFECT_RESULT_REVEAL_DELAY_MS,
    );

    return () => {
      window.clearTimeout(spotlightTimer);
      window.clearTimeout(revealTimer);
    };
  });
</script>

<section
  id="result"
  class="result-screen"
  class:is-perfect={summary.perfect}
  class:is-result-revealed={resultRevealed}
  aria-labelledby={resultRevealed ? "result-title" : undefined}
  aria-label={resultRevealed ? undefined : "全問正解の結果"}
  aria-busy={resultRevealed ? undefined : "true"}
  data-perfect-stage={summary.perfect ? perfectStage : "not-perfect"}
>
  {#if summary.perfect}
    <div class="perfect-dimmer" aria-hidden="true"></div>
    {#if spotlightVisible}
      <div class="perfect-spotlight" aria-hidden="true"></div>
    {/if}
    {#if resultRevealed}
      <PerfectConfetti />
    {/if}
  {/if}

  {#if resultRevealed}
    <div class="result-content">
      <h2 id="result-title" bind:this={resultTitleElement} tabindex="-1">
        <MixedFontText text={summary.headline} messageWrap />
      </h2>

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
      <ActionButton
        id="back-home"
        label="トップページに戻る"
        variant="secondary"
        onClick={onHome}
      />
    </div>
  {/if}
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

  .result-screen.is-perfect {
    overflow: hidden;
  }

  .perfect-dimmer {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: rgb(0 12 9 / 48%);
    pointer-events: none;
    transition: opacity 600ms ease-out;
    animation: dim-perfect-stage 420ms ease-out both;
  }

  .is-perfect.is-result-revealed .perfect-dimmer {
    opacity: 0.68;
  }

  .perfect-spotlight {
    position: absolute;
    top: -8vh;
    left: 50%;
    z-index: 1;
    width: min(145vw, 42rem);
    height: 112vh;
    background: linear-gradient(
      180deg,
      rgb(255 246 187 / 58%),
      rgb(255 225 103 / 22%) 54%,
      transparent 88%
    );
    clip-path: polygon(44% 0, 56% 0, 91% 100%, 9% 100%);
    filter: blur(11px);
    mix-blend-mode: screen;
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%);
    transform-origin: 50% 0;
    animation: reveal-spotlight 1.05s ease-out both;
  }

  .perfect-spotlight::after {
    position: absolute;
    right: 10%;
    bottom: 5%;
    left: 10%;
    height: 17%;
    border-radius: 50%;
    background: radial-gradient(
      ellipse,
      rgb(255 233 137 / 46%),
      transparent 69%
    );
    content: "";
    filter: blur(8px);
  }

  .result-content {
    position: relative;
    z-index: 3;
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
    transform-origin: center bottom;
    animation: perfect-headline-bounce 900ms cubic-bezier(0.2, 0.78, 0.3, 1.2)
      70ms both;
  }

  .is-perfect .result-content {
    animation: reveal-perfect-content 520ms ease-out both;
  }

  .is-perfect .result-stats {
    animation: reveal-perfect-panel 520ms ease-out 180ms both;
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
    z-index: 3;
    display: grid;
    flex: 0 0 auto;
    gap: 0.85rem;
    width: 100%;
  }

  .is-perfect .result-actions {
    animation: reveal-perfect-panel 460ms ease-out 300ms both;
  }

  @keyframes dim-perfect-stage {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes reveal-spotlight {
    from {
      opacity: 0;
      transform: translateX(-50%) scaleX(0.42);
    }

    to {
      opacity: 0.9;
      transform: translateX(-50%) scaleX(1);
    }
  }

  @keyframes reveal-perfect-content {
    from {
      opacity: 0;
      transform: translateY(1rem) scale(0.96);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes reveal-perfect-panel {
    from {
      opacity: 0;
      transform: translateY(0.8rem);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes perfect-headline-bounce {
    0% {
      opacity: 0;
      transform: translateY(1.4rem) scale(0.72);
    }

    42% {
      opacity: 1;
      transform: translateY(-0.35rem) scale(1.14);
    }

    64% {
      transform: translateY(0.16rem) scale(0.94);
    }

    82% {
      transform: translateY(-0.08rem) scale(1.05);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-height: 650px) {
    .result-content {
      gap: 1rem;
      padding-block: 0.4rem 1rem;
    }

    .result-stats {
      padding-block: 0.9rem;
    }

    .stat-divider {
      margin-block: 0.7rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .perfect-dimmer,
    .perfect-spotlight {
      display: none;
    }

    .is-perfect .result-content,
    .is-perfect .result-content h2,
    .is-perfect .result-stats,
    .is-perfect .result-actions {
      animation: none;
    }
  }
</style>
