<script lang="ts">
  import { formatDifficulty } from "../review.ts";
  import type { Difficulty } from "../types.ts";

  interface Props {
    difficulty: Difficulty;
  }

  let { difficulty }: Props = $props();
</script>

<span class="difficulty-badge" class:is-hard={difficulty === "hard"}>
  <span aria-hidden="true">◆</span>
  難易度: {formatDifficulty(difficulty)}
</span>

<style>
  .difficulty-badge {
    display: inline-flex;
    min-height: 1.75rem;
    align-items: center;
    gap: 0.35rem;
    padding: 0.24rem 0.62rem;
    border: 1px solid rgb(255 255 255 / 16%);
    border-radius: 999px;
    background: rgb(0 38 29 / 44%);
    color: #dbeae4;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
  }

  .difficulty-badge span {
    color: var(--correct);
    font-size: 0.55rem;
  }

  .difficulty-badge.is-hard {
    border-color: rgb(255 228 94 / 28%);
    color: #fff0aa;
  }

  .difficulty-badge.is-hard span {
    color: var(--accent-emphasis);
  }
</style>
