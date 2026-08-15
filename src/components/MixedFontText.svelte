<script lang="ts">
  import {
    splitAtNaturalBreaks,
    splitResultMessageAtNaturalBreaks,
  } from "../text-wrap.ts";

  interface Props {
    text?: string;
    phraseWrap?: boolean;
    messageWrap?: boolean;
  }

  let { text = "", phraseWrap = false, messageWrap = false }: Props = $props();

  const phrases = $derived(
    phraseWrap
      ? splitAtNaturalBreaks(text)
      : messageWrap
        ? splitResultMessageAtNaturalBreaks(text)
        : [String(text)],
  );
  const wrapsPhrases = $derived(phraseWrap || messageWrap);

  function fontParts(phrase: string): string[] {
    return phrase.split(/([A-Za-z0-9.]+)/).filter(Boolean);
  }

  function usesMPlus(part: string): boolean {
    return /^[A-Za-z0-9.]+$/.test(part);
  }
</script>

<span class="mixed-font-text">
  {#each phrases as phrase, phraseIndex (`${phraseIndex}-${phrase}`)}
    <span class:phrase={wrapsPhrases}>
      {#each fontParts(phrase) as part, partIndex (`${partIndex}-${part}`)}
        {#if usesMPlus(part)}
          <span class="mplus">{part}</span>
        {:else}
          {part}
        {/if}
      {/each}
    </span>{#if wrapsPhrases && phraseIndex < phrases.length - 1}<wbr />{/if}
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
    display: inline-block;
    max-width: 100%;
    overflow-wrap: anywhere;
    white-space: normal;
  }
</style>
