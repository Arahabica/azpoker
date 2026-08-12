<script lang="ts">
  interface Props {
    delayMs?: number;
    label?: string;
  }

  let { delayMs = 0, label = "読み込んでいます" }: Props = $props();
</script>

<svg
  class="loading-spinner"
  viewBox="0 0 44 44"
  role="status"
  style={`--loading-indicator-delay: ${delayMs}ms`}
>
  <title>{label}</title>
  <circle class="loading-spinner-track" cx="22" cy="22" r="17"></circle>
  <circle class="loading-spinner-arc" cx="22" cy="22" r="17"></circle>
</svg>

<style>
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
