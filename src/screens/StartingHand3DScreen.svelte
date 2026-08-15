<script lang="ts">
  import { onMount, type Component } from "svelte";

  import type { AppPath } from "../app-route.ts";
  import LoadingSpinner from "../components/LoadingSpinner.svelte";
  import PageNavigationLink from "../components/PageNavigationLink.svelte";
  import {
    PREFLOP_EQUITY_CELLS,
    type PreflopEquityCell,
  } from "../preflop-equity.ts";

  interface Props {
    onNavigate: (path: AppPath) => void;
  }

  interface SceneProps {
    cells: readonly PreflopEquityCell[];
    selectedHand: string | null;
    resetToken: number;
    descriptionId: string;
    onSelect: (cell: PreflopEquityCell | null) => void;
    onReady: () => void;
    onError: (message: string) => void;
  }

  let { onNavigate }: Props = $props();

  let SceneView = $state<Component<SceneProps> | null>(null);
  let loadError = $state("");
  let sceneReady = $state(false);
  let selectedHand = $state<string | null>(null);
  let resetToken = $state(0);

  const selectedCell = $derived(
    selectedHand === null
      ? null
      : (PREFLOP_EQUITY_CELLS.find((cell) => cell.hand === selectedHand) ??
          null),
  );

  function selectCell(cell: PreflopEquityCell | null): void {
    selectedHand = cell?.hand ?? null;
  }

  function resetView(): void {
    resetToken += 1;
  }

  function handleSceneError(message: string): void {
    loadError = message;
    sceneReady = false;
  }

  onMount(() => {
    let active = true;
    void import("../components/StartingHand3DScene.svelte")
      .then((module) => {
        if (active) SceneView = module.default;
      })
      .catch(() => {
        if (active) {
          loadError = "3D表示の読み込みに失敗しました。";
        }
      });
    return () => {
      active = false;
    };
  });
</script>

<section
  class="immersive-three-dimensional-page"
  aria-labelledby="public-page-title"
  aria-busy={!sceneReady && !loadError}
>
  <div class="scene-frame" class:is-ready={sceneReady}>
    {#if loadError}
      <div class="scene-error" role="alert">
        <p>{loadError}</p>
      </div>
    {:else}
      {#if !sceneReady}
        <div class="scene-loading">
          <LoadingSpinner label="3D表示を読み込んでいます" />
          <p>3D表示を読み込んでいます</p>
        </div>
      {/if}
      {#if SceneView}
        <SceneView
          cells={PREFLOP_EQUITY_CELLS}
          {selectedHand}
          {resetToken}
          descriptionId="starting-hand-3d-description"
          onSelect={selectCell}
          onReady={() => (sceneReady = true)}
          onError={handleSceneError}
        />
      {/if}
    {/if}
  </div>

  <header class="scene-hud">
    <div class="hud-row">
      <div class="navigation-surface">
        <PageNavigationLink
          path="/"
          label="トップへ"
          ariaLabel="トップページへ戻る"
          tone="on-light"
          onNavigate={() => onNavigate("/")}
        />
      </div>
      <button
        class="reset-view"
        type="button"
        onclick={resetView}
        disabled={!sceneReady}
      >
        視点をリセット
      </button>
    </div>

    <h1 id="public-page-title" tabindex="-1">スターティングハンド勝率表(3D)</h1>
  </header>

  {#if selectedCell}
    <div class="selected-hand" aria-live="polite" aria-atomic="true">
      <strong>{selectedCell.hand}</strong>
      <span>{selectedCell.equity.toFixed(1)}%</span>
      <small>{selectedCell.strength}</small>
    </div>
  {/if}

  <p id="starting-hand-3d-description" class="visually-hidden">
    柱の高さは6人卓における勝率を表します。1本指またはマウスのドラッグで回転し、ピンチまたはホイールで拡大・縮小できます。柱を選ぶとハンド名、勝率、強さを確認でき、柱以外を選ぶと選択を解除します。
  </p>

  <table class="accessible-data">
    <caption>6人卓のスターティングハンド勝率表</caption>
    <thead>
      <tr>
        <th scope="col">ハンド</th>
        <th scope="col">勝率</th>
        <th scope="col">強さ</th>
      </tr>
    </thead>
    <tbody>
      {#each PREFLOP_EQUITY_CELLS as cell (cell.hand)}
        <tr>
          <th scope="row">{cell.hand}</th>
          <td>{cell.equity.toFixed(1)}%</td>
          <td>{cell.strength}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<style>
  .immersive-three-dimensional-page {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: #fff;
    color: #17221e;
    font-family:
      -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI",
      "Meiryo UI", sans-serif;
  }

  .scene-frame {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #fff;
  }

  .scene-frame:not(.is-ready) :global(.scene-host) {
    opacity: 0;
  }

  .scene-loading,
  .scene-error {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 0.85rem;
    padding: 1.5rem;
    color: #35413d;
    font-size: 0.82rem;
    line-height: 1.7;
    text-align: center;
  }

  .scene-loading :global(.loading-spinner) {
    color: rgb(53 65 61 / 78%);
  }

  .scene-hud {
    position: absolute;
    inset: 0 0 auto;
    z-index: 3;
    display: grid;
    gap: 0.45rem;
    padding: max(0.75rem, env(safe-area-inset-top))
      max(0.75rem, env(safe-area-inset-right)) 0
      max(0.75rem, env(safe-area-inset-left));
    pointer-events: none;
  }

  .hud-row {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .navigation-surface,
  .reset-view,
  .scene-hud h1,
  .selected-hand {
    border: 1px solid rgb(23 34 30 / 12%);
    background: rgb(255 255 255 / 82%);
    box-shadow: 0 0.35rem 1.2rem rgb(38 48 44 / 12%);
    backdrop-filter: blur(10px);
  }

  .navigation-surface {
    padding-inline: 0.35rem;
    border-radius: 0.75rem;
    pointer-events: auto;
  }

  .reset-view {
    min-height: 2.75rem;
    padding-inline: 0.85rem;
    border-radius: 0.75rem;
    color: #27332f;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
    pointer-events: auto;
  }

  .reset-view:disabled {
    cursor: wait;
    opacity: 0.48;
  }

  .reset-view:focus-visible {
    outline-color: rgb(23 34 30 / 82%);
  }

  .scene-hud h1 {
    justify-self: start;
    max-width: calc(100vw - 1.5rem);
    margin: 0;
    padding: 0.58rem 0.75rem;
    border-radius: 0.75rem;
    color: #17221e;
    font-size: 20px;
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.5;
    pointer-events: auto;
  }

  .selected-hand {
    position: absolute;
    right: max(0.75rem, env(safe-area-inset-right));
    bottom: max(0.75rem, env(safe-area-inset-bottom));
    z-index: 3;
    display: grid;
    grid-template-columns: auto auto;
    align-items: baseline;
    gap: 0.08rem 0.7rem;
    min-width: 8.5rem;
    padding: 0.72rem 0.9rem;
    border-color: rgb(177 137 0 / 24%);
    border-radius: 0.8rem;
    pointer-events: none;
  }

  .selected-hand strong,
  .selected-hand span {
    color: #17221e;
    font-family: "Arbutus Slab", "M PLUS Rounded 1c UI", sans-serif;
    font-size: 1rem;
  }

  .selected-hand small {
    grid-column: 1 / -1;
    color: #59645f;
    font-size: 0.66rem;
  }

  .accessible-data,
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (hover: hover) {
    .reset-view:not(:disabled):hover {
      border-color: rgb(23 34 30 / 28%);
      background: rgb(255 255 255 / 94%);
    }
  }
</style>
