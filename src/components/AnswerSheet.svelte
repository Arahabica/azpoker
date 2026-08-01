<script>
  import { formatActualPercent } from "../game.js";
  import MixedFontText from "./MixedFontText.svelte";

  let { correct, question, isLast, onNext } = $props();
</script>

<section
  class="answer-sheet"
  aria-live="polite"
  aria-labelledby="feedback-title"
>
  <span class="sheet-handle" aria-hidden="true"></span>
  <div class="answer-mark" data-result={correct ? "correct" : "wrong"} aria-hidden="true">
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
    {correct ? "正解" : "不正解"}
  </p>
  <p class="actual-probability">{formatActualPercent(question.trueP)}</p>
  <p class="explanation"><MixedFontText text={question.explain} /></p>
  <button
    id="next-question"
    class="primary-action next-action"
    type="button"
    onclick={onNext}
  >{isLast ? "結果を見る" : "次の問題へ"}</button>
</section>
