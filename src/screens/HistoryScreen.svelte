<script lang="ts">
  import type { AppPath } from "../app-route.ts";
  import HistoryList from "../components/HistoryList.svelte";
  import PublicPageShell from "../components/PublicPageShell.svelte";
  import type { QuizHistoryEntry } from "../result-history.ts";

  interface Props {
    history: readonly QuizHistoryEntry[];
    onNavigate: (path: AppPath) => void;
  }

  let { history, onNavigate }: Props = $props();
</script>

<PublicPageShell
  title="履歴"
  lead="この端末で完了した、直近50回の結果です。"
  {onNavigate}
>
  {#if history.length > 0}
    <section aria-labelledby="history-list-title">
      <h2 id="history-list-title">クイズ結果</h2>
      <HistoryList entries={history} />
    </section>
  {:else}
    <section class="empty-history" aria-labelledby="empty-history-title">
      <h2 id="empty-history-title">まだ履歴がありません</h2>
      <p>クイズを最後まで解くと、ここに結果が保存されます。</p>
      <button type="button" onclick={() => onNavigate("/")}
        >問題に挑戦する</button
      >
    </section>
  {/if}
</PublicPageShell>

<style>
  .empty-history button {
    min-height: 3.2rem;
    margin-top: 1.1rem;
    padding-inline: 1.3rem;
    border: 1px solid rgb(255 255 255 / 20%);
    border-radius: 0.9rem;
    background: var(--accent);
    box-shadow: 0 0.22rem 0 var(--accent-pressed);
    color: var(--accent-ink);
    cursor: pointer;
    font-weight: 700;
  }

  .empty-history button:active {
    transform: translateY(0.12rem);
    box-shadow: 0 0.1rem 0 var(--accent-pressed);
  }
</style>
