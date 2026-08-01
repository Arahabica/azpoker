<script>
  import { cardDetails } from "../game.js";
  import { CARD_SUITS } from "./card-suits.js";
  import CardFace from "./card-faces/CardFace.svelte";

  let {
    card,
    index = 0,
    variant = "board",
    isNew = false,
    decorative = variant === "logo",
  } = $props();

  const details = $derived(cardDetails(card));
  const suit = $derived(CARD_SUITS[details.suit]);
  const rotation = $derived(
    variant === "hole"
      ? index === 0
        ? "-6deg"
        : "6deg"
      : variant === "logo"
        ? index === 0
          ? "-9deg"
          : "8deg"
        : "0deg",
  );
</script>

<span
  class="playing-card"
  class:playing-card--board={variant === "board"}
  class:playing-card--hole={variant === "hole"}
  class:playing-card--logo={variant === "logo"}
  class:is-new-card={isNew}
  data-tone={details.tone}
  data-rank={details.rank}
  style={`--deal-index: ${index}; --card-rotation: ${rotation};`}
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
    --card-rotation: 0deg;
    --corner-center-x: 22%;
    --rank-optical-shift: 0cqi;
    position: relative;
    display: block;
    flex: 0 0 auto;
    aspect-ratio: 5 / 7;
    overflow: hidden;
    border: 1px solid rgb(20 31 27 / 24%);
    border-radius: clamp(0.38rem, 1.8vw, 0.62rem);
    background:
      radial-gradient(circle at 24% 14%, #fff 0, transparent 30%),
      linear-gradient(145deg, var(--paper), var(--paper-shadow));
    color: var(--ink);
    container-type: inline-size;
    box-shadow:
      0 0.5rem 0.85rem rgb(0 29 22 / 30%),
      inset 0 0 0 1px rgb(255 255 255 / 64%);
    transform: rotate(var(--card-rotation));
    transform-origin: 50% 88%;
    animation: deal-card 240ms cubic-bezier(0.18, 0.78, 0.25, 1) both;
    animation-delay: calc(var(--deal-index) * 42ms);
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

  .playing-card--board {
    width: 100%;
  }

  .playing-card--hole {
    width: clamp(4.35rem, 21vw, 5.5rem);
  }

  .playing-card--logo {
    width: clamp(4.7rem, 22vw, 5.6rem);
    box-shadow:
      0 0.8rem 1.4rem rgb(0 30 22 / 32%),
      inset 0 0 0 1px rgb(255 255 255 / 72%);
  }

  .playing-card.is-new-card {
    animation-duration: 300ms;
  }

</style>
