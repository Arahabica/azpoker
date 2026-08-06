<script lang="ts">
  import { formatActualPercent } from "../game.ts";
  import ActionButton from "./ActionButton.svelte";
  import MixedFontText from "./MixedFontText.svelte";
  import type { Question } from "../types.ts";

  interface Props {
    correct: boolean;
    timedOut?: boolean;
    question: Question;
    isLast: boolean;
    blocked?: boolean;
    onNext: () => void;
    onRequestLeave: () => void;
  }

  let {
    correct,
    timedOut = false,
    question,
    isLast,
    blocked = false,
    onNext,
    onRequestLeave,
  }: Props = $props();

  function getFeedbackTitle(): string {
    if (timedOut) return "時間切れ";
    if (correct) return "正解";
    return "不正解";
  }

  const feedbackTitle = $derived(getFeedbackTitle());
</script>

<section
  class="answer-sheet"
  aria-live="polite"
  aria-labelledby="feedback-title"
  aria-hidden={blocked ? "true" : undefined}
  inert={blocked}
>
  <span class="sheet-handle" aria-hidden="true"></span>
  <button
    id="leave-quiz"
    class="leave-button"
    type="button"
    aria-label="問題を終了する"
    onclick={onRequestLeave}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 20H2"></path>
      <path
        d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"
      ></path>
      <path d="M11 4H8a2 2 0 0 0-2 2v14"></path>
      <path d="M14 12h.01"></path>
      <path d="M22 20h-3"></path>
    </svg>
  </button>
  <div
    class="answer-mark"
    data-result={correct ? "correct" : "wrong"}
    aria-hidden="true"
  >
    <svg class="answer-icon answer-icon-check" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20"></circle>
      <path d="m15 24 6 6 13-14"></path>
    </svg>
    <svg class="answer-icon answer-icon-cross" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20"></circle>
      <path d="m17 17 14 14m0-14L17 31"></path>
    </svg>
  </div>
  <p id="feedback-title" class="feedback-title">
    {feedbackTitle}
  </p>
  <p class="actual-probability">{formatActualPercent(question.trueP)}</p>
  <p class="explanation"><MixedFontText text={question.explain} /></p>
  <ActionButton
    id="next-question"
    label={isLast ? "結果を見る" : "次の問題へ"}
    onClick={onNext}
  />
</section>

<style>
  .answer-sheet {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    max-height: min(56vh, 28rem);
    padding: 0.7rem var(--gutter) max(1.15rem, env(safe-area-inset-bottom));
    overflow-y: auto;
    border-top: 1px solid rgb(255 255 255 / 11%);
    border-radius: 1.55rem 1.55rem 0 0;
    background: #11211d;
    box-shadow: 0 -1.5rem 3rem rgb(0 27 20 / 38%);
    text-align: center;
    animation: raise-sheet 280ms cubic-bezier(0.2, 0.76, 0.28, 1) both;
  }

  .sheet-handle {
    display: block;
    width: 2.6rem;
    height: 0.28rem;
    margin: 0 auto 0.9rem;
    border-radius: 999px;
    background: rgb(255 255 255 / 19%);
  }

  .leave-button {
    position: absolute;
    top: 0.72rem;
    right: var(--gutter);
    display: grid;
    width: 2.35rem;
    height: 2.35rem;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #fff;
    cursor: pointer;
  }

  .leave-button svg {
    width: 1.4rem;
    fill: none;
    opacity: 0.42;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  .answer-mark {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 0.35rem;
  }

  .answer-icon {
    display: none;
    width: 100%;
    height: 100%;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3.5;
  }

  .answer-mark[data-result="correct"] .answer-icon-check {
    display: block;
    stroke: var(--correct);
  }

  .answer-mark[data-result="wrong"] .answer-icon-cross {
    display: block;
    stroke: var(--wrong);
  }

  .feedback-title {
    color: var(--text);
    font-size: 1.12rem;
    font-weight: 800;
  }

  .actual-probability {
    margin-top: 0.35rem;
    color: var(--accent-emphasis);
    font-size: clamp(2.5rem, 12vw, 3.4rem);
    font-weight: 400;
    letter-spacing: -0.06em;
    font-variant-numeric: tabular-nums;
  }

  .explanation {
    max-width: 24rem;
    margin: 0.2rem auto 1rem;
    color: #d1dfda;
    font-size: 0.9rem;
    line-height: 1.65;
    text-wrap: balance;
  }

  @keyframes raise-sheet {
    from {
      opacity: 0;
      transform: translateY(100%);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (hover: hover) {
    .leave-button:hover {
      background: rgb(255 255 255 / 6%);
    }

    .leave-button:hover svg {
      opacity: 0.68;
    }
  }

  @media (max-height: 620px) {
    .answer-sheet {
      max-height: 62vh;
    }

    .answer-mark {
      width: 2.45rem;
      height: 2.45rem;
    }

    .actual-probability {
      font-size: 2.35rem;
    }
  }
</style>
