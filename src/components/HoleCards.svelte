<script lang="ts">
  import PlayingCard from "./PlayingCard.svelte";
  import type { Card } from "../types.ts";

  interface CardAngles {
    start: string;
    end: string;
  }

  interface Props {
    cards?: readonly Card[];
  }

  const DEFAULT_CARD_ANGLES: Readonly<CardAngles> = {
    start: "0deg",
    end: "0deg",
  };
  const HOLE_CARD_ANGLES: readonly Readonly<CardAngles>[] = [
    { start: "-3deg", end: "-6deg" },
    { start: "3deg", end: "6deg" },
  ];

  let { cards = [] }: Props = $props();
</script>

<div class="hand-area">
  <div class="hand-cards" role="group" aria-label="手札">
    {#each cards as card, index (card)}
      {@const angles = HOLE_CARD_ANGLES[index] ?? DEFAULT_CARD_ANGLES}
      <div
        class="hand-card"
        style={`--card-start-angle: ${angles.start}; --card-end-angle: ${angles.end};`}
      >
        <PlayingCard {card} />
      </div>
    {/each}
  </div>
</div>

<style>
  .hand-area {
    display: grid;
    place-items: center;
  }

  .hand-cards {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: clamp(6.1rem, 28vw, 8rem);
  }

  .hand-card + .hand-card {
    margin-left: clamp(-1.25rem, -4vw, -0.85rem);
  }

  .hand-card {
    width: clamp(4.35rem, 21vw, 5.5rem);
    transform: rotate(var(--card-end-angle));
    transform-origin: 50% 88%;
    animation:
      reveal-hole-card
      var(--card-reveal-duration)
      var(--card-reveal-easing)
      both;
  }

  .hand-card:first-child {
    z-index: 1;
  }

  .hand-card:last-child {
    z-index: 2;
  }

  @keyframes reveal-hole-card {
    from {
      opacity: var(--card-reveal-start-opacity);
      transform:
        translateY(var(--card-reveal-start-y))
        rotate(var(--card-start-angle));
    }

    to {
      opacity: 1;
      transform: translateY(0) rotate(var(--card-end-angle));
    }
  }

  @media (max-height: 620px) {
    .hand-cards {
      min-height: 5.5rem;
    }
  }
</style>
