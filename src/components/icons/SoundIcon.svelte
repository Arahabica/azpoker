<script lang="ts">
  interface Props {
    enabled: boolean;
  }

  let { enabled }: Props = $props();
</script>

<svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true">
  <path
    d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298Z"
  ></path>
  {#if enabled}
    <path d="M16 9a5 5 0 0 1 0 6"></path>
    <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
  {:else}
    <line x1="22" x2="16" y1="9" y2="15"></line>
    <line x1="16" x2="22" y1="9" y2="15"></line>
  {/if}
</svg>

<style>
  .sound-icon {
    width: var(--sound-icon-size, 2.25rem);
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
</style>
