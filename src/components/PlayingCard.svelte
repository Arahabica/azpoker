<script lang="ts">
  import { cardDetails } from "../game.ts";
  import { CARD_SUITS } from "./card-suits.ts";
  import CardFace from "./card-faces/CardFace.svelte";
  import type { Card } from "../types.ts";

  interface Props {
    card: Card;
    decorative?: boolean;
  }

  let { card, decorative = false }: Props = $props();

  const details = $derived(cardDetails(card));
  const suit = $derived(CARD_SUITS[details.suit]);
</script>

<span
  class="playing-card"
  data-tone={details.tone}
  data-rank={details.rank}
  role={decorative ? undefined : "img"}
  aria-label={decorative ? undefined : details.ariaLabel}
  aria-hidden={decorative ? "true" : undefined}
>
  <CardFace
    rank={details.rank}
    suitPath={suit.path}
    suitViewBox={suit.viewBox}
  />
</span>

<style>
  .playing-card {
    --corner-center-x: 22%;
    --rank-optical-shift: 0cqi;
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 5 / 7;
    overflow: hidden;
    border: 1px solid rgb(20 31 27 / 24%);
    border-radius: clamp(0.38rem, 1.8vw, 0.62rem);
    background:
      radial-gradient(circle at 24% 14%, #fff 0, transparent 30%),
      linear-gradient(145deg, var(--paper), var(--paper-shadow));
    color: var(--ink);
    container-type: inline-size;
    box-shadow: var(
      --card-context-shadow,
      0 0.5rem 0.85rem rgb(0 29 22 / 30%),
      inset 0 0 0 1px rgb(255 255 255 / 64%)
    );
  }

  .playing-card[data-tone="red"] {
    color: var(--red-suit);
  }

  .playing-card[data-rank="Q"] {
    --rank-optical-shift: -1.5cqi;
  }

  .playing-card[data-rank="K"] {
    --rank-optical-shift: -2cqi;
  }

</style>
