<script lang="ts">
  interface Props {
    direction: "left" | "right";
  }

  let { direction }: Props = $props();
</script>

<svg class="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
  {#if direction === "left"}
    <path d="m15 18-6-6 6-6"></path>
  {:else}
    <path d="m9 18 6-6-6-6"></path>
  {/if}
</svg>

<style>
  .chevron-icon {
    display: block;
    flex: 0 0 auto;
    width: var(--chevron-icon-size, 1rem);
    fill: none;
    opacity: var(--chevron-icon-opacity, 1);
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
</style>
