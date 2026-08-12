<script lang="ts">
  import type { DisplayRank } from "../../types.ts";
  import SuitIcon from "../icons/SuitIcon.svelte";

  interface Props {
    rank: DisplayRank;
    suitPath: string;
    suitViewBox: string;
  }

  let { rank, suitPath, suitViewBox }: Props = $props();
</script>

<span class="face" aria-hidden="true">
  <span class="corner">
    <span class="rank">{rank}</span>
    <SuitIcon path={suitPath} viewBox={suitViewBox} placement="corner" />
  </span>
  <SuitIcon path={suitPath} viewBox={suitViewBox} placement="center" />
</span>

<style>
  .face {
    position: absolute;
    inset: 0;
  }

  .corner {
    position: absolute;
    top: 7%;
    left: var(--corner-center-x);
    display: grid;
    justify-items: center;
    font-family: var(--card-rank-font);
    font-weight: 800;
    line-height: 0.88;
    transform: translateX(-50%);
  }

  .rank {
    font-size: 1.25rem;
    font-size: 34cqi;
    letter-spacing: -0.06em;
    font-variant-numeric: lining-nums tabular-nums;
    transform: translateX(var(--rank-optical-shift));
  }
</style>
