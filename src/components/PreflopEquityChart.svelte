<script lang="ts">
  import { shouldHandleAppNavigation, type AppPath } from "../app-route.ts";
  import {
    PREFLOP_EQUITY_CELLS,
    PREFLOP_RANKS,
    PREFLOP_TIER_LABELS,
    getPreflopTierRange,
    type PreflopTier,
  } from "../preflop-equity.ts";

  const cellsByPosition = new Map(
    PREFLOP_EQUITY_CELLS.map(
      (cell) => [`${cell.rowIndex}-${cell.columnIndex}`, cell] as const,
    ),
  );

  interface Props {
    onNavigate: (path: AppPath) => void;
  }

  let { onNavigate }: Props = $props();

  function showThreeDimensionalChart(event: MouseEvent): void {
    if (!shouldHandleAppNavigation(event)) return;
    event.preventDefault();
    onNavigate("/starting-hand-3d");
  }
</script>

<section class="equity-chart" aria-labelledby="preflop-equity-title">
  <div class="chart-section chart-section-top">
    <div class="chart-copy">
      <h3 id="preflop-equity-title">スターティングハンド勝率表</h3>
      <p>ハンド名の色で、ショーダウン時の強さを確認できます。</p>
    </div>
  </div>

  <div class="table-bleed">
    <table aria-label="6人卓のスターティングハンド勝率表">
      <tbody>
        {#each PREFLOP_RANKS as rank, rowIndex (rank)}
          <tr>
            {#each PREFLOP_RANKS as columnRank, columnIndex (`${rowIndex}-${columnRank}`)}
              {@const cell = cellsByPosition.get(`${rowIndex}-${columnIndex}`)}
              {#if cell}
                <td
                  data-tier={cell.tier}
                  aria-label={`${cell.hand}、${cell.strength}`}
                >
                  {cell.hand}
                </td>
              {:else}
                <td aria-label="データなし">-</td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="chart-section chart-section-bottom">
    <div class="chart-guide">
      <p><strong>s</strong>＝同じマーク／<strong>o</strong>＝別のマーク</p>
    </div>

    <ul class="strength-legend" aria-label="勝率による強さの色分け">
      {#each PREFLOP_TIER_LABELS as label, tierIndex (label)}
        {@const tier = (tierIndex + 1) as PreflopTier}
        <li>
          <i data-tier={tier} aria-hidden="true"></i>
          <span>{label}</span>
          <small>{getPreflopTierRange(tier)}</small>
        </li>
      {/each}
    </ul>

    <p class="player-context">
      6人卓で最初に判断する場合の目安です。7人卓でも、最初の1人がフォールドして自分に回ってきた場合は、おおむね同じ基準です。どちらも、自分のあとに判断する相手が5人います。
    </p>

    <a
      class="three-dimensional-link"
      href="/starting-hand-3d"
      onclick={showThreeDimensionalChart}>3Dで見る</a
    >

    <p class="chart-source">
      100万回のシミュレーションによるポット獲得率（引き分け分を含む）。出典：
      <a
        href="https://lapoker.info/ranking/"
        rel="external noopener"
        target="_blank">LA Poker.info</a
      >
    </p>
  </div>
</section>

<style>
  .equity-chart {
    --chart-card-border-width: 1px;
    --chart-card-padding-inline: 1.25rem;
    --chart-panel-background: rgb(2 42 32 / 45%);
    --table-bleed: var(--lp-padding-horizontal);

    display: grid;
    width: 100%;
  }

  .chart-section {
    padding-inline: var(--chart-card-padding-inline);
    border-inline: var(--chart-card-border-width) solid rgb(255 255 255 / 11%);
    background: var(--chart-panel-background);
  }

  .chart-section-top {
    padding-block: 1.5rem 1.7rem;
    border-top: var(--chart-card-border-width) solid rgb(255 255 255 / 11%);
    border-radius: 1.3rem 1.3rem 0 0;
    box-shadow: inset 0 1px rgb(255 255 255 / 4%);
  }

  .chart-section-bottom {
    display: grid;
    gap: 1.7rem;
    padding-block: 1.7rem 1.5rem;
    border-bottom: var(--chart-card-border-width) solid rgb(255 255 255 / 11%);
    border-radius: 0 0 1.3rem 1.3rem;
    background: var(--chart-panel-background);
    box-shadow: 0 0.8rem 2rem rgb(0 35 26 / 10%);
  }

  .chart-copy {
    display: grid;
    gap: 0.75rem;
  }

  h3 {
    color: var(--text);
    font-weight: 750;
    padding: 0;
    margin: 0;
    letter-spacing: -0.035em;
    line-height: 1.5;
  }

  .chart-copy p {
    color: #c5d9d2;
    font-size: 0.9rem;
    line-height: 1.95;
  }

  .table-bleed {
    width: calc(100% + var(--table-bleed) + var(--table-bleed));
    margin-inline: calc(0px - var(--table-bleed));
    padding: 6px;
    background: var(--chart-panel-background);
  }

  table {
    width: 100%;
    border-spacing: 1px;
    background: rgb(0 0 0 / 28%);
    table-layout: fixed;
  }

  td {
    height: clamp(1.32rem, 5.8vw, 1.72rem);
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 0;
    color: #fff;
    font-family: "Arbutus Slab", "M PLUS Rounded 1c UI", sans-serif;
    font-size: clamp(0.43rem, 2.2vw, 0.62rem);
    font-weight: 700;
    letter-spacing: -0.06em;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
  }

  td[data-tier="1"],
  .strength-legend i[data-tier="1"] {
    background: rgb(0 0 0 / 42%);
  }

  td[data-tier="2"],
  .strength-legend i[data-tier="2"] {
    background: rgb(245 245 240 / 52%);
  }

  td[data-tier="2"] {
    color: #17221e;
  }

  td[data-tier="3"],
  .strength-legend i[data-tier="3"] {
    background: #197847;
  }

  td[data-tier="4"],
  .strength-legend i[data-tier="4"] {
    background: #ce3f49;
  }

  td[data-tier="5"],
  .strength-legend i[data-tier="5"] {
    background: #050606;
  }

  .chart-guide,
  .player-context,
  .chart-source {
    padding-inline: 0.55rem;
    color: #a9c3ba;
    font-size: 0.64rem;
    line-height: 1.65;
  }

  .chart-guide strong {
    color: #eef7f3;
  }

  .player-context {
    color: #c5d9d2;
    font-size: 0.68rem;
  }

  .three-dimensional-link {
    justify-self: start;
    margin-inline: 0.55rem;
    color: #d4c781;
    font-size: 0.64rem;
    line-height: 1.65;
    text-underline-offset: 0.2em;
  }

  .three-dimensional-link:focus-visible {
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
  }

  .strength-legend {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.25rem;
    margin: 0;
    padding: 0 0.55rem;
    list-style: none;
  }

  .strength-legend li {
    display: grid;
    justify-items: center;
    gap: 0.18rem;
    min-width: 0;
    color: #dce9e4;
    font-size: clamp(0.48rem, 2.1vw, 0.62rem);
    line-height: 1.3;
    text-align: center;
  }

  .strength-legend i {
    display: block;
    width: 100%;
    height: 0.42rem;
    border: 1px solid rgb(255 255 255 / 10%);
  }

  .strength-legend small {
    color: #a9c3ba;
    font-size: 0.52rem;
    white-space: nowrap;
  }

  .chart-source a:focus-visible {
    border-radius: 0.15rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 2px;
  }

  .chart-source a {
    color: #d4c781;
    text-underline-offset: 0.2em;
  }

  @media (hover: hover) {
    .three-dimensional-link:hover {
      color: #fff0aa;
    }

    .chart-source a:hover {
      color: #fff0aa;
    }
  }
</style>
