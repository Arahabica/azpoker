<script lang="ts">
  import type { AppPath } from "../app-route.ts";
  import HistoryDetail from "../components/HistoryDetail.svelte";
  import HistoryPanel from "../components/HistoryPanel.svelte";
  import PublicPageShell from "../components/PublicPageShell.svelte";
  import {
    getOlderHistoryEntry,
    type QuizHistoryEntry,
  } from "../result-history.ts";

  interface Props {
    history: readonly QuizHistoryEntry[];
    detailId?: string | null;
    detailNavigationPath?: AppPath;
    detailNavigationLabel?: string;
    detailNavigationAriaLabel?: string;
    onNavigate: (path: AppPath) => void;
    onOpenHistory: (id: string) => void;
    onOpenOlderHistory: (id: string) => void;
    onLeaveDetail: (path: AppPath) => void;
  }

  let {
    history,
    detailId = null,
    detailNavigationPath = "/history",
    detailNavigationLabel = "履歴一覧へ戻る",
    detailNavigationAriaLabel = "履歴一覧へ戻る",
    onNavigate,
    onOpenHistory,
    onOpenOlderHistory,
    onLeaveDetail,
  }: Props = $props();

  const selectedEntry = $derived(
    history.find((entry) => entry.id === detailId) ?? null,
  );
  const olderEntry = $derived(
    detailId ? getOlderHistoryEntry(history, detailId) : null,
  );

  function selectHistory(entry: QuizHistoryEntry): void {
    onOpenHistory(entry.id);
  }

  function selectOlderHistory(entry: QuizHistoryEntry): void {
    onOpenOlderHistory(entry.id);
  }
</script>

<PublicPageShell
  title="履歴"
  showHeading={false}
  immersiveBody={Boolean(detailId)}
  navigationPath={detailId ? detailNavigationPath : "/"}
  navigationLabel={detailId ? detailNavigationLabel : "トップへ"}
  navigationAriaLabel={detailId
    ? detailNavigationAriaLabel
    : "トップページへ戻る"}
  {onNavigate}
  onHeaderNavigate={detailId ? onLeaveDetail : onNavigate}
>
  {#if detailId && selectedEntry}
    <HistoryDetail
      entry={selectedEntry}
      {olderEntry}
      onNext={selectOlderHistory}
    />
  {:else if detailId}
    <section class="empty-history" aria-labelledby="missing-history-title">
      <h2 id="missing-history-title">履歴が見つかりません</h2>
      <p>この履歴は削除されたか、別の端末に保存されています。</p>
    </section>
  {:else if history.length > 0}
    <HistoryPanel entries={history} onSelect={selectHistory} />
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
