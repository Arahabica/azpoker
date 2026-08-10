<script lang="ts">
  import { formatElapsedTime } from "../result-summary.ts";
  import {
    formatRelativeHistoryTime,
    type QuizHistoryEntry,
  } from "../result-history.ts";
  import HistoryQuestionCard from "./HistoryQuestionCard.svelte";

  interface Props {
    entry: QuizHistoryEntry;
  }

  let { entry }: Props = $props();
</script>

<div class="history-detail">
  <header class="detail-header">
    <div>
      <p class="detail-date">
        {formatRelativeHistoryTime(entry.completedAt)}のセット
      </p>
      <h2 id="history-detail-title" tabindex="-1">回答の振り返り</h2>
    </div>
    <div class="detail-stats" aria-label="セットの結果">
      <span><strong>{entry.score}</strong>/{entry.total}問</span>
      <span>{formatElapsedTime(entry.elapsedMs)}</span>
    </div>
  </header>

  {#if entry.answers.length > 0}
    <ol class="question-history" aria-label="このセットの全問題">
      {#each entry.answers as answer, index (`${entry.id}-${index}`)}
        <li>
          <HistoryQuestionCard {answer} {index} />
        </li>
      {/each}
    </ol>
  {:else}
    <section class="legacy-history-notice">
      <h2>問題ごとの記録がありません</h2>
      <p>
        このセットは履歴機能の更新前に保存されたため、スコアと時間だけ確認できます。
      </p>
    </section>
  {/if}
</div>

<style>
  .history-detail {
    display: grid;
    gap: 1rem;
    width: 100%;
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .detail-header {
    display: grid;
    gap: 1rem;
    padding: 0.45rem 0 1rem;
  }

  .detail-header > div:first-child {
    display: grid;
    gap: 0.35rem;
  }

  .detail-date {
    color: var(--muted);
    font-size: 0.76rem;
  }

  .detail-header h2 {
    color: var(--text);
    font-size: clamp(1.55rem, 7vw, 2rem);
    letter-spacing: -0.04em;
    line-height: 1.35;
  }

  .detail-header h2:focus {
    outline: none;
  }

  .detail-stats {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.8rem 1rem;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 0.9rem;
    background: rgb(0 31 24 / 34%);
    color: #dbeae4;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }

  .detail-stats strong {
    color: var(--text);
    font-size: 1.25rem;
  }

  .question-history {
    display: grid;
    gap: 1.35rem;
    margin: 0;
    padding: 0 0 2rem;
    list-style: none;
  }

  .legacy-history-notice {
    padding: 1.25rem;
    border: 1px solid rgb(255 255 255 / 11%);
    border-radius: 1.15rem;
    background: rgb(2 42 32 / 45%);
  }
</style>
