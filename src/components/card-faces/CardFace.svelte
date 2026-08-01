<script>
  let { rank, suitPath, suitViewBox } = $props();
</script>

<span class="face" aria-hidden="true">
  <span class="corner">
    <span class="rank">{rank}</span>
    <svg class="corner-suit" viewBox={suitViewBox}>
      <path d={suitPath}></path>
    </svg>
  </span>
  <svg class="center-suit" viewBox={suitViewBox}>
    <path d={suitPath}></path>
  </svg>
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

  .corner-suit {
    width: 0.78rem;
    width: 19cqi;
    margin-top: 4cqi;
    fill: currentcolor;
  }

  .center-suit {
    position: absolute;
    top: 62%;
    left: 50%;
    width: 52%;
    fill: currentcolor;
    transform: translate(-50%, -50%);
  }
</style>
