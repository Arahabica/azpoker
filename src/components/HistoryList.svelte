<script lang="ts">
  import { formatElapsedTime, formatTimeLimit } from "../result-summary.ts";
  import {
    formatRelativeHistoryTime,
    type QuizHistoryEntry,
  } from "../result-history.ts";

  interface Props {
    entries: readonly QuizHistoryEntry[];
    compact?: boolean;
  }

  let { entries, compact = false }: Props = $props();
</script>

<ol class="history-list" class:compact aria-label="クイズ結果">
  {#each entries as entry (entry.id)}
    <li>
      {#if compact}
        <article class="compact-row">
          <time datetime={new Date(entry.completedAt).toISOString()}>
            {formatRelativeHistoryTime(entry.completedAt)}
          </time>
          <p class="compact-score">
            <strong>{entry.score}</strong><span>/{entry.total}問</span>
          </p>
          <p class="compact-elapsed">{formatElapsedTime(entry.elapsedMs)}</p>
        </article>
      {:else}
        <article>
          <time datetime={new Date(entry.completedAt).toISOString()}>
            {formatRelativeHistoryTime(entry.completedAt)}
          </time>
          <div class="history-summary">
            <p class="score">
              <strong>{entry.score}</strong><span> / {entry.total}問</span>
            </p>
            <p class="elapsed">{formatElapsedTime(entry.elapsedMs)}</p>
          </div>
          <div class="history-details">
            <span>制限時間 {formatTimeLimit(entry.timeLimitMs)}</span>
            {#if entry.timeoutCount > 0}
              <span>時間切れ {entry.timeoutCount}問</span>
            {/if}
          </div>
        </article>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .history-list {
    display: grid;
    gap: 0.7rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-variant-numeric: tabular-nums;
  }

  article {
    display: grid;
    gap: 0.6rem;
    padding: 1rem 1.05rem;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 1rem;
    background: rgb(0 31 24 / 34%);
  }

  time {
    color: var(--muted);
    font-size: 0.7rem;
    line-height: 1.4;
  }

  .history-summary {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }

  .score,
  .elapsed {
    color: var(--text);
  }

  .score strong {
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1;
  }

  .score span {
    color: #c5d9d2;
    font-size: 0.78rem;
  }

  .elapsed {
    font-size: 1.02rem;
    font-weight: 650;
  }

  .history-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.8rem;
    color: var(--muted);
    font-size: 0.7rem;
    line-height: 1.5;
  }

  .compact {
    gap: 0.35rem;
  }

  .compact-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: 0.65rem;
    min-height: 2.15rem;
    padding: 0.42rem 0.7rem;
    border-radius: 0.65rem;
  }

  .compact-row time {
    overflow: hidden;
    font-size: 0.66rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compact-score,
  .compact-elapsed {
    color: #dbeae4;
    white-space: nowrap;
  }

  .compact-score strong {
    font-size: 0.84rem;
    font-weight: 700;
  }

  .compact-score span {
    color: var(--muted);
    font-size: 0.65rem;
  }

  .compact-elapsed {
    font-size: 0.72rem;
  }
</style>
