<script lang="ts">
  import HistoryList from "./HistoryList.svelte";
  import type { QuizHistoryEntry } from "../result-history.ts";

  interface Props {
    entries: readonly QuizHistoryEntry[];
    showMore?: boolean;
    onShowMore?: (event: MouseEvent) => void;
    onSelect?: (entry: QuizHistoryEntry) => void;
  }

  let { entries, showMore = false, onShowMore, onSelect }: Props = $props();
</script>

<div class="history-panel" role="region" aria-labelledby="recent-history-title">
  <h2 id="recent-history-title" class="history-panel-title" tabindex="-1">
    最近の履歴
  </h2>
  {#if onSelect}
    <HistoryList {entries} {onSelect} />
  {:else}
    <HistoryList {entries} />
  {/if}
  {#if showMore}
    <a class="more-link" href="/history" onclick={onShowMore}>もっと見る</a>
  {/if}
</div>

<style>
  .history-panel {
    display: grid;
    gap: 0.55rem;
    width: 100%;
    padding-bottom: 1.2rem;
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Landing", sans-serif;
  }

  .history-panel-title {
    color: #dbeae4;
    font-size: 0.9rem;
    letter-spacing: 0.01em;
    line-height: 1.4;
  }

  .more-link {
    justify-self: end;
    color: rgb(255 255 255 / 58%);
    font-size: 0.78rem;
    line-height: 1.5;
    text-decoration: none;
    text-underline-offset: 0.22em;
  }

  .more-link:focus-visible {
    border-radius: 0.15rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    .more-link:hover {
      color: rgb(255 255 255 / 78%);
      text-decoration: underline;
    }
  }
</style>
