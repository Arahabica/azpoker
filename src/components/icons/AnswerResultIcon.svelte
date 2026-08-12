<script lang="ts">
  interface Props {
    correct: boolean;
  }

  let { correct }: Props = $props();
</script>

<svg
  class="answer-result-icon"
  class:is-correct={correct}
  viewBox="0 0 48 48"
  aria-hidden="true"
>
  <circle cx="24" cy="24" r="20"></circle>
  {#if correct}
    <path d="m15 24 6 6 13-14"></path>
  {:else}
    <path d="m17 17 14 14m0-14L17 31"></path>
  {/if}
</svg>

<style>
  .answer-result-icon {
    display: block;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: var(--wrong);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3.5;
  }

  .answer-result-icon.is-correct {
    stroke: var(--correct);
  }
</style>
