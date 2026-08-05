<script lang="ts">
  import { formatElapsedTime, formatTimeLimit } from "../result-summary.ts";
  import type { QuizHistoryEntry } from "../result-history.ts";

  interface Props {
    entries: readonly QuizHistoryEntry[];
    compact?: boolean;
  }

  let { entries, compact = false }: Props = $props();

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function formatCompletedAt(completedAt: number): string {
    return dateFormatter.format(new Date(completedAt));
  }
</script>

<ol class="history-list" class:compact aria-label="クイズ結果">
  {#each entries as entry (entry.id)}
    <li>
      <article>
        <time datetime={new Date(entry.completedAt).toISOString()}>
          {formatCompletedAt(entry.completedAt)}
        </time>
        <div class="history-summary">
          <p class="score">
            <strong>{entry.score}</strong><span> / {entry.total}問</span>
          </p>
          <p class="elapsed">{formatElapsedTime(entry.elapsedMs)}</p>
        </div>
        <div class="history-details">
          {#if !compact}
            <span>制限時間 {formatTimeLimit(entry.timeLimitMs)}</span>
          {/if}
          {#if entry.timeoutCount > 0}
            <span>時間切れ {entry.timeoutCount}問</span>
          {/if}
        </div>
      </article>
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

  .compact article {
    padding: 0.9rem 1rem;
  }
</style>
