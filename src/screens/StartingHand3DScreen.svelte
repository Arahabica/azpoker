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

  <header class="scene-heading">
    <h1 id="public-page-title" tabindex="-1">スターティングハンド勝率表(3D)</h1>

    {#if selectedCell}
      <div class="selected-hand" aria-live="polite" aria-atomic="true">
        <strong>{selectedCell.hand}</strong>
        <span>{selectedCell.equity.toFixed(1)}%</span>
        <small>{selectedCell.strength}</small>
      </div>
    {/if}
  </header>

  <div class="navigation-surface">
    <PageNavigationLink
      path="/"
      label="トップへ"
      ariaLabel="トップページへ戻る"
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

  .scene-heading {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 3;
    display: grid;
    width: calc(100vw - 1.5rem);
    justify-items: center;
    gap: 0.45rem;
    padding-top: max(0.75rem, env(safe-area-inset-top));
    pointer-events: none;
    transform: translateX(-50%);
  }

  .scene-heading h1 {
    margin: 0;
    color: #17221e;
    font-size: 20px;
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.5;
    text-align: center;
  }

  .navigation-surface,
  .reset-view {
    position: absolute;
    bottom: max(0.75rem, env(safe-area-inset-bottom));
    z-index: 3;
    border: 1px solid rgb(255 255 255 / 16%);
    background: rgb(0 0 0 / 62%);
    box-shadow: 0 0.35rem 1.2rem rgb(0 0 0 / 16%);
    backdrop-filter: blur(10px);
  }

  .navigation-surface {
    left: max(0.75rem, env(safe-area-inset-left));
    padding-inline: 16px;
    border-radius: 0.75rem;
    pointer-events: auto;
  }

  .reset-view {
    left: 50%;
    min-height: 2.75rem;
    padding-inline: 0.85rem;
    border-radius: 0.75rem;
    color: #f7faf8;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
    pointer-events: auto;
    transform: translateX(-50%);
  }

  .reset-view:disabled {
    cursor: wait;
    opacity: 0.48;
  }

  .selected-hand {
    display: grid;
    grid-template-columns: auto auto;
    align-items: baseline;
    gap: 0.08rem 0.7rem;
    min-width: 8.5rem;
    padding: 0.72rem 0.9rem;
    border: 1px solid rgb(177 137 0 / 24%);
    border-radius: 0.8rem;
    background: rgb(255 255 255 / 84%);
    box-shadow: 0 0.35rem 1.2rem rgb(38 48 44 / 12%);
    backdrop-filter: blur(10px);
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
      border-color: rgb(255 255 255 / 34%);
      background: rgb(0 0 0 / 76%);
    }
  }
</style>
