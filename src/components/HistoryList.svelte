<script lang="ts">
  import { formatElapsedTime } from "../result-summary.ts";
  import {
    formatRelativeHistoryTime,
    type QuizHistoryEntry,
  } from "../result-history.ts";

  interface Props {
    entries: readonly QuizHistoryEntry[];
  }

  let { entries }: Props = $props();
</script>

<ol class="history-list" aria-label="クイズ結果">
  {#each entries as entry (entry.id)}
    <li>
      <article class="history-row">
        <time datetime={new Date(entry.completedAt).toISOString()}>
          {formatRelativeHistoryTime(entry.completedAt)}
        </time>
        <span class="history-score">
          <strong>{entry.score}</strong><span>/{entry.total}問</span>
        </span>
        <span class="history-elapsed">{formatElapsedTime(entry.elapsedMs)}</span
        >
      </article>
    </li>
  {/each}
</ol>

<style>
  .history-list {
    display: grid;
    gap: 0.42rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-variant-numeric: tabular-nums;
  }

  .history-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: 0.75rem;
    min-height: 3rem;
    padding: 0.75rem 0.8rem;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 0.78rem;
    background: rgb(0 31 24 / 34%);
    line-height: 1.4;
  }

  .history-row time {
    overflow: hidden;
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-score,
  .history-elapsed {
    color: #dbeae4;
    white-space: nowrap;
  }

  .history-score strong {
    font-size: 1rem;
    font-weight: 700;
  }

  .history-score span {
    color: var(--muted);
    font-size: 0.78rem;
  }

  .history-elapsed {
    font-size: 0.86rem;
  }
</style>
