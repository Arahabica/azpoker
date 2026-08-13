<script lang="ts">
  import equityRows from "../generated/preflop-equity-table.json";

  type PlayerCount = 6 | 9;

  const RANKS = [..."AKQJT98765432"] as const;
  const TIERS = [
    { tier: 1, label: "とても弱い", range: "16%未満" },
    { tier: 2, label: "弱い", range: "16%以上" },
    { tier: 3, label: "中", range: "22%以上" },
    { tier: 4, label: "強い", range: "25%以上" },
    { tier: 5, label: "とても強い", range: "30%以上" },
  ] as const;
  const equityByHand = new Map(
    equityRows.map((row) => [row.hand, row] as const),
  );

  let playerCount = $state<PlayerCount>(6);

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
    return playerCount === 6 ? row.players6 : row.players9;
  }

  function tierFor(value: number): number {
    if (value >= 30) return 5;
    if (value >= 25) return 4;
    if (value >= 22) return 3;
    if (value >= 16) return 2;
    return 1;
  }
</script>

<section class="equity-chart" aria-labelledby="preflop-equity-title">
  <div class="chart-copy">
    <h3 id="preflop-equity-title">スターティングハンド勝率表</h3>
    <p>ハンド名の色で、ショーダウン時の強さを確認できます。</p>
  </div>

  <table aria-label={`${playerCount}人卓のスターティングハンド勝率表`}>
    <tbody>
      {#each RANKS as rank, rowIndex (rank)}
        <tr>
          {#each RANKS as columnRank, columnIndex (`${rowIndex}-${columnRank}`)}
            {@const hand = handAt(rowIndex, columnIndex)}
            {@const value = equityFor(hand)}
            {@const tier = tierFor(value)}
            {@const strength = TIERS[tier - 1]!.label}
            <td data-tier={tier} aria-label={`${hand}、${strength}`}>
              {hand}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="chart-guide">
    <p><strong>s</strong>＝同じマーク／<strong>o</strong>＝別のマーク</p>
  </div>

  <ul class="strength-legend" aria-label="勝率による強さの色分け">
    {#each TIERS as item (item.tier)}
      <li>
        <i data-tier={item.tier} aria-hidden="true"></i>
        <span>{item.label}</span>
        <small>{item.range}</small>
      </li>
    {/each}
  </ul>

  <div class="player-toggle" role="group" aria-label="卓人数を切り替える">
    <button
      type="button"
      class:active={playerCount === 6}
      aria-pressed={playerCount === 6}
      onclick={() => (playerCount = 6)}>6人卓</button
    >
    <span aria-hidden="true">/</span>
    <button
      type="button"
      class:active={playerCount === 9}
      aria-pressed={playerCount === 9}
      onclick={() => (playerCount = 9)}>9人卓</button
    >
  </div>

  <p class="player-context" aria-live="polite">
    {playerCount}人卓で最初に判断する場合の目安です。{playerCount +
      1}人卓でも、最初の1人がフォールドして自分に回ってきた場合は、おおむね同じ基準です。どちらも、自分のあとに判断する相手が{playerCount -
      1}人います。
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
    display: grid;
    gap: 1rem;
    width: calc(100% + (var(--lp-padding-horizontal) * 2));
    margin-left: calc(var(--lp-padding-horizontal) * -1);
    padding: 1.35rem max(4px, calc(var(--lp-padding-horizontal) / 4)) 1.1rem;
    border-block: 1px solid rgb(255 255 255 / 12%);
    background:
      radial-gradient(circle at 84% 0%, rgb(34 154 117 / 15%), transparent 35%),
      rgb(2 42 32 / 55%);
    box-shadow:
      inset 0 1px rgb(255 255 255 / 4%),
      0 0.8rem 2rem rgb(0 35 26 / 10%);
  }

  .chart-copy {
    display: grid;
    gap: 0.35rem;
    padding-inline: 0.55rem;
  }

  h3 {
    margin: 0;
    color: var(--text);
    font-size: 1.15rem;
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.5;
  }

  .chart-copy p {
    color: #c5d9d2;
    font-size: 0.75rem;
    line-height: 1.7;
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

  .player-toggle {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.3rem;
    padding-inline: 0.55rem;
    color: rgb(223 237 232 / 36%);
    font-size: 0.65rem;
  }

  .player-toggle button {
    min-height: 1.75rem;
    padding: 0.2rem 0.3rem;
    border: 0;
    background: transparent;
    color: rgb(223 237 232 / 45%);
    font: inherit;
    cursor: pointer;
  }

  .player-toggle button.active {
    color: #eef7f3;
    text-decoration: underline;
    text-decoration-color: rgb(247 221 112 / 72%);
    text-underline-offset: 0.26em;
  }

  .player-toggle button:focus-visible,
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
    .player-toggle button:hover,
    .chart-source a:hover {
      color: #fff0aa;
    }
  }
</style>
