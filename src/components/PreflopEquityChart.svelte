<script lang="ts">
  import equityRows from "../generated/preflop-equity-table.json";

  const RANKS = [..."AKQJT98765432"] as const;
  const TIER_LABELS = [
    "とても弱い",
    "弱い",
    "中",
    "強い",
    "とても強い",
  ] as const;
  const TIER_THRESHOLDS = [16, 22, 25, 30] as const;
  const equityByHand = new Map(
    equityRows.map((row) => [row.hand, row] as const),
  );

  function handAt(rowIndex: number, columnIndex: number): string {
    const rowRank = RANKS[rowIndex]!;
    const columnRank = RANKS[columnIndex]!;
    if (rowIndex === columnIndex) return `${rowRank}${columnRank}`;
    if (rowIndex < columnIndex) return `${rowRank}${columnRank}s`;
    return `${columnRank}${rowRank}o`;
  }

  function equityFor(hand: string): number {
    const row = equityByHand.get(hand);
    if (!row) throw new Error(`勝率表に${hand}がありません`);
    return row.players6;
  }

  function tierFor(value: number): number {
    if (value >= TIER_THRESHOLDS[3]) return 5;
    if (value >= TIER_THRESHOLDS[2]) return 4;
    if (value >= TIER_THRESHOLDS[1]) return 3;
    if (value >= TIER_THRESHOLDS[0]) return 2;
    return 1;
  }

  function rangeFor(tierIndex: number): string {
    return tierIndex === 0
      ? `${TIER_THRESHOLDS[0]}%未満`
      : `${TIER_THRESHOLDS[tierIndex - 1]}%以上`;
  }
</script>

<section class="equity-chart" aria-labelledby="preflop-equity-title">
  <div class="chart-copy">
    <h3 id="preflop-equity-title">スターティングハンド勝率表</h3>
    <p>ハンド名の色で、ショーダウン時の強さを確認できます。</p>
  </div>

  <div class="table-bleed">
    <table aria-label="6人卓のスターティングハンド勝率表">
      <tbody>
        {#each RANKS as rank, rowIndex (rank)}
          <tr>
            {#each RANKS as columnRank, columnIndex (`${rowIndex}-${columnRank}`)}
              {@const hand = handAt(rowIndex, columnIndex)}
              {@const value = equityFor(hand)}
              {@const tier = tierFor(value)}
              {@const strength = TIER_LABELS[tier - 1]!}
              <td data-tier={tier} aria-label={`${hand}、${strength}`}>
                {hand}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="chart-guide">
    <p><strong>s</strong>＝同じマーク／<strong>o</strong>＝別のマーク</p>
  </div>

  <ul class="strength-legend" aria-label="勝率による強さの色分け">
    {#each TIER_LABELS as label, tierIndex (label)}
      {@const tier = tierIndex + 1}
      <li>
        <i data-tier={tier} aria-hidden="true"></i>
        <span>{label}</span>
        <small>{rangeFor(tierIndex)}</small>
      </li>
    {/each}
  </ul>

  <p class="player-context">
    6人卓で最初に判断する場合の目安です。7人卓でも、最初の1人がフォールドして自分に回ってきた場合は、おおむね同じ基準です。どちらも、自分のあとに判断する相手が5人います。
  </p>

  <p class="chart-source">
    100万回のシミュレーションによるポット獲得率（引き分け分を含む）。出典：
    <a
      href="https://lapoker.info/ranking/"
      rel="external noopener"
      target="_blank">LA Poker.info</a
    >
  </p>
</section>

<style>
  .equity-chart {
    --chart-card-padding-inline: 1.25rem;
    --chart-surface: rgb(2 42 32);
    --table-bleed: calc(
      var(--lp-padding-horizontal) + var(--chart-card-padding-inline) - 4px
    );

    display: grid;
    gap: 1.7rem;
    padding: 1.5rem var(--chart-card-padding-inline);
    border: 1px solid rgb(255 255 255 / 11%);
    border-radius: 1.3rem;
    background: rgb(2 42 32 / 45%);
    box-shadow:
      inset 0 1px rgb(255 255 255 / 4%),
      0 0.8rem 2rem rgb(0 35 26 / 10%);
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
    background: var(--chart-surface);
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
    color: #8eaaa0;
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
    .chart-source a:hover {
      color: #fff0aa;
    }
  }
</style>
