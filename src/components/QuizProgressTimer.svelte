<script lang="ts">
  import {
    getCountdownSnapshot,
    startQuestionCountdown,
  } from "../question-timer.ts";
  import type { QuestionOutcome } from "../types.ts";

  interface Props {
    currentIndex: number;
    total: number;
    outcomes?: readonly (QuestionOutcome | null)[];
    durationMs: number;
    running?: boolean;
    onTimeout: (questionIndex: number) => void;
  }

  let {
    currentIndex,
    total,
    outcomes = [],
    durationMs,
    running = false,
    onTimeout,
  }: Props = $props();

  let remainingMs = $state(0);
  const countdown = $derived(getCountdownSnapshot(durationMs, remainingMs));

  $effect(() => {
    const questionIndex = currentIndex;
    const questionDurationMs = durationMs;
    const shouldRun = running;

    remainingMs = questionDurationMs;
    if (!shouldRun || typeof window === "undefined") {
      return;
    }

    return startQuestionCountdown({
      durationMs: questionDurationMs,
      onUpdate: (nextRemainingMs) => {
        remainingMs = nextRemainingMs;
      },
      onExpire: () => onTimeout(questionIndex),
    });
  });
</script>

<div class="quiz-progress-timer">
  <div
    class="progress-segments"
    role="progressbar"
    aria-label="問題の進み具合"
    aria-valuemin="1"
    aria-valuemax={total}
    aria-valuenow={currentIndex + 1}
    aria-valuetext={`${currentIndex + 1}問目 / ${total}問`}
  >
    {#each Array.from({ length: total }, (_, index) => index) as index (index)}
      {@const outcome = outcomes[index]}
      {@const isActive = index === currentIndex}
      <span
        class="progress-segment"
        class:is-active={isActive}
        class:is-running={isActive && running}
        class:is-warning={isActive &&
          running &&
          countdown.warning === "warning"}
        class:is-critical={isActive &&
          running &&
          countdown.warning === "critical"}
        class:is-correct={outcome === "correct"}
        class:is-wrong={outcome === "wrong" || outcome === "timeout"}
        style={isActive
          ? `--active-weight: ${durationMs / 1_000}; --timer-progress: ${countdown.elapsedProgress};`
          : undefined}
        aria-hidden="true"
      >
        {#if isActive && running}
          <span class="segment-fill"></span>
        {/if}
      </span>
    {/each}
  </div>

  {#if running}
    <span class="visually-hidden" role="timer">
      残り{countdown.seconds}秒
    </span>
  {/if}

  {#if running && (countdown.warning === "warning" || countdown.warning === "critical")}
    <span
      class="screen-time-warning"
      class:is-critical-screen={countdown.warning === "critical"}
      aria-hidden="true"
    ></span>
  {/if}
</div>

<style>
  .quiz-progress-timer {
    flex: 1;
    min-width: 0;
  }

  .progress-segments {
    display: flex;
    align-items: center;
    gap: 3px;
    width: 100%;
    height: 0.4rem;
  }

  .progress-segment {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    height: 0.4rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgb(0 35 27 / 42%);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 16%);
    transition:
      flex-grow 200ms cubic-bezier(0.22, 0.72, 0.3, 1),
      background 160ms ease;
  }

  .progress-segment.is-active {
    flex-grow: var(--active-weight);
    background: rgb(0 35 27 / 58%);
    box-shadow:
      inset 0 1px 2px rgb(0 0 0 / 20%),
      0 0 0 1px rgb(255 255 255 / 9%);
  }

  .progress-segment.is-correct {
    background: var(--correct);
    box-shadow: 0 0 0.55rem rgb(32 202 145 / 28%);
  }

  .progress-segment.is-wrong {
    background: var(--wrong);
    box-shadow: 0 0 0.55rem rgb(255 107 111 / 28%);
  }

  .segment-fill {
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    background: rgb(255 255 255 / 94%);
    box-shadow: 0 0 0.55rem rgb(255 255 255 / 34%);
    transform: scaleX(var(--timer-progress));
    transform-origin: left center;
    will-change: transform;
  }

  .is-warning .segment-fill {
    box-shadow: 0 0 0.7rem rgb(255 255 255 / 50%);
  }

  .is-critical .segment-fill {
    box-shadow: 0 0 0.85rem rgb(255 255 255 / 66%);
  }

  .progress-segment.is-critical {
    animation: critical-timer-pulse 620ms ease-in-out infinite;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    border: 0;
    white-space: nowrap;
  }

  .screen-time-warning {
    position: fixed;
    inset: 0;
    z-index: 7;
    width: min(100%, var(--app-max-width));
    margin-inline: auto;
    background: rgb(255 24 48 / 28%);
    box-shadow: inset 0 0 2.5rem rgb(255 0 32 / 24%);
    opacity: 0.28;
    pointer-events: none;
    animation: screen-time-warning-pulse 680ms ease-in-out infinite;
  }

  .screen-time-warning.is-critical-screen {
    background: rgb(255 16 42 / 36%);
    box-shadow: inset 0 0 3.5rem rgb(255 0 24 / 36%);
    opacity: 0.42;
    animation-duration: 360ms;
  }

  @keyframes critical-timer-pulse {
    50% {
      box-shadow:
        inset 0 1px 2px rgb(0 0 0 / 18%),
        0 0 0.9rem rgb(255 255 255 / 72%);
    }
  }

  @keyframes screen-time-warning-pulse {
    50% {
      opacity: 0.88;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-segment {
      transition: none;
    }

    .progress-segment.is-critical {
      animation: none;
    }

    .screen-time-warning {
      opacity: 0.55;
      animation: none;
    }

    .screen-time-warning.is-critical-screen {
      opacity: 0.7;
    }
  }
</style>
