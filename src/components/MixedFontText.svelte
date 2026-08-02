<script>
  import { splitAtNaturalBreaks } from "../text-wrap.js";

  let { text = "", phraseWrap = false } = $props();

  const phrases = $derived(
    phraseWrap ? splitAtNaturalBreaks(text) : [String(text)],
  );

  function fontParts(phrase) {
    return phrase.split(/([A-Za-z0-9%]+)/).filter(Boolean);
  }

  function usesMPlus(part) {
    return /^[A-Za-z0-9%]+$/.test(part);
  }
</script>

<span class="mixed-font-text">
  {#each phrases as phrase, phraseIndex (`${phraseIndex}-${phrase}`)}
    <span class:phrase={phraseWrap}>
      {#each fontParts(phrase) as part, partIndex (`${partIndex}-${part}`)}
        {#if usesMPlus(part)}
          <span class="mplus">{part}</span>
        {:else}
          {part}
        {/if}
      {/each}
    </span>{#if phraseWrap && phraseIndex < phrases.length - 1}<wbr />{/if}
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

  .phrase {
    white-space: nowrap;
  }
</style>
