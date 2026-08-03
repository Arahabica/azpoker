<script lang="ts">
  import PlayingCard from "./PlayingCard.svelte";
  import type { Card } from "../types.ts";

  const LOGO_CARDS: readonly {
    card: Card;
    start: string;
    end: string;
  }[] = [
    { card: "As", start: "-10deg", end: "-9deg" },
    { card: "Th", start: "9deg", end: "8deg" },
  ];
</script>

<div class="logo-cards" aria-hidden="true">
  {#each LOGO_CARDS as logoCard (logoCard.card)}
    <div
      class="logo-card"
      style={`--card-start-angle: ${logoCard.start}; --card-end-angle: ${logoCard.end};`}
    >
      <PlayingCard card={logoCard.card} decorative />
    </div>
  {/each}
</div>

<style>
  .logo-cards {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 8.5rem;
  }

  .logo-card {
    --card-reveal-duration: 200ms;
    --card-reveal-start-opacity: 0.8;
    --card-context-shadow:
      0 0.8rem 1.4rem rgb(0 30 22 / 32%), inset 0 0 0 1px rgb(255 255 255 / 72%);
    width: clamp(4.7rem, 22vw, 5.6rem);
    transform: rotate(var(--card-end-angle));
    transform-origin: 50% 88%;
    animation: reveal-logo-card var(--card-reveal-duration)
      var(--card-reveal-easing) both;
  }

  .logo-card + .logo-card {
    margin-left: -1.15rem;
  }

  @keyframes reveal-logo-card {
    from {
      opacity: var(--card-reveal-start-opacity);
      transform: translateY(var(--card-reveal-start-y))
        rotate(var(--card-start-angle));
    }

    to {
      opacity: 1;
      transform: translateY(0) rotate(var(--card-end-angle));
    }
  }
</style>
