<script>
  let { text = "" } = $props();

  const parts = $derived(
    String(text).split(/([A-Za-z0-9%]+)/).filter(Boolean),
  );

  function usesMPlus(part) {
    return /^[A-Za-z0-9%]+$/.test(part);
  }
</script>

<span class="mixed-font-text">
  {#each parts as part, index (`${index}-${part}`)}
    {#if usesMPlus(part)}
      <span class="mplus">{part}</span>
    {:else}
      {part}
    {/if}
  {/each}
</span>

<style>
  .mixed-font-text {
    display: inline;
  }

  .mplus {
    font-family: "M PLUS Rounded 1c UI", sans-serif;
    font-weight: 400;
  }
</style>
