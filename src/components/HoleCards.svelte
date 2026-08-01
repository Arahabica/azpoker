<script>
  import PlayingCard from "./PlayingCard.svelte";

  let { cards = [] } = $props();
</script>

<div class="hand-area">
  <div class="hand-cards" role="group" aria-label="手札">
    {#each cards as card, index (card)}
      <div class="hand-card">
        <PlayingCard {card} {index} variant="hole" />
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

  .hand-card:first-child {
    z-index: 1;
  }

  .hand-card:last-child {
    z-index: 2;
  }

  @media (max-height: 620px) {
    .hand-cards {
      min-height: 5.5rem;
    }
  }
</style>
