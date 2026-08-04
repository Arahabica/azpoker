<script lang="ts">
  interface Props {
    delayMs: number;
  }

  let { delayMs }: Props = $props();
</script>

<section
  class="preparation-loading-screen"
  aria-label="問題を読み込んでいます"
  aria-busy="true"
  style={`--loading-indicator-delay: ${delayMs}ms`}
>
  <svg class="loading-spinner" viewBox="0 0 44 44" role="status">
    <title>問題を読み込んでいます</title>
    <circle class="loading-spinner-track" cx="22" cy="22" r="17"></circle>
    <circle class="loading-spinner-arc" cx="22" cy="22" r="17"></circle>
  </svg>
</section>

<style>
  .preparation-loading-screen {
    display: grid;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    place-items: center;
    pointer-events: none;
  }

  .loading-spinner {
    width: 2.75rem;
    height: 2.75rem;
    opacity: 0;
    color: rgb(247 250 248 / 78%);
    animation:
      loading-spinner-appear 140ms ease-out var(--loading-indicator-delay)
        forwards,
      loading-spinner-rotate 900ms linear var(--loading-indicator-delay)
        infinite;
  }

  .loading-spinner-track,
  .loading-spinner-arc {
    fill: none;
    stroke: currentcolor;
    stroke-width: 3;
  }

  .loading-spinner-track {
    opacity: 0.16;
  }

  .loading-spinner-arc {
    stroke-dasharray: 53 107;
    stroke-linecap: round;
  }

  @keyframes loading-spinner-appear {
    to {
      opacity: 1;
    }
  }

  @keyframes loading-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: loading-spinner-appear 1ms linear
        var(--loading-indicator-delay) forwards;
    }
  }
</style>
