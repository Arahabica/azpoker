<script lang="ts">
  import ChevronIcon from "./icons/ChevronIcon.svelte";
  import { formatElapsedTime } from "../result-summary.ts";
  import {
    formatRelativeHistoryTime,
    type QuizHistoryEntry,
  } from "../result-history.ts";

  interface Props {
    entries: readonly QuizHistoryEntry[];
    onSelect?: (entry: QuizHistoryEntry) => void;
  }

  let { entries, onSelect }: Props = $props();

  function selectEntry(entry: QuizHistoryEntry): void {
    onSelect?.(entry);
  }
</script>

<ol class="history-list" aria-label="クイズ結果">
  {#each entries as entry (entry.id)}
    <li>
      <button
        class="history-row"
        class:is-selectable={Boolean(onSelect)}
        type="button"
        disabled={!onSelect}
        onclick={() => selectEntry(entry)}
        aria-label={`${formatRelativeHistoryTime(entry.completedAt)}の結果、${entry.score}/${entry.total}問、詳細を見る`}
      >
        <time datetime={new Date(entry.completedAt).toISOString()}>
          {formatRelativeHistoryTime(entry.completedAt)}
        </time>
        <span class="history-score">
          <strong>{entry.score}</strong><span>/{entry.total}問</span>
        </span>
        <span class="history-elapsed">{formatElapsedTime(entry.elapsedMs)}</span
        >
        {#if onSelect}
          <span class="row-arrow"><ChevronIcon direction="right" /></span>
        {/if}
      </button>
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
    --chevron-icon-opacity: 0.5;
    --chevron-icon-size: 1rem;

    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: 0.75rem;
    width: 100%;
    min-height: 3rem;
    padding: 0.75rem 0.8rem;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 0.78rem;
    background: rgb(0 31 24 / 34%);
    color: inherit;
    cursor: default;
    line-height: 1.4;
    text-align: left;
  }

  .history-row:disabled {
    opacity: 1;
  }

  .history-row.is-selectable {
    padding-right: 2rem;
    cursor: pointer;
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

  .row-arrow {
    position: absolute;
    top: 50%;
    right: 0.65rem;
    transform: translateY(-50%);
  }

  @media (hover: hover) {
    .history-row.is-selectable:hover {
      border-color: rgb(255 255 255 / 24%);
      background: rgb(0 31 24 / 55%);
    }
  }
</style>
