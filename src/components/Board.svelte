<script>
  import PlayingCard from "./PlayingCard.svelte";

  let { cards = [], revealKey } = $props();
</script>

<div
  class="board"
  role="group"
  aria-label="コミュニティカード"
>
  {#each cards as card, index (`${revealKey}-${card}-${index}`)}
    <div class="board-card">
      <PlayingCard {card} {index} variant="board" />
    </div>
  {/each}
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;
    gap: clamp(0.25rem, 1.4vw, 0.45rem);
    width: 100%;
    min-height: clamp(4.7rem, 23.5vw, 7.2rem);
  }

  .board-card {
    min-width: 0;
    animation: reveal-board-card 350ms ease-in-out both;
  }

  @keyframes reveal-board-card {
    from {
      opacity: 0.4;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
