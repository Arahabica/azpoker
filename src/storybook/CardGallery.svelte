<script lang="ts">
  import PlayingCard from "../components/PlayingCard.svelte";
  import type { Card } from "../types.ts";

  const cards: readonly Card[] = ["As", "5h", "Td", "Jc", "Qh", "Ks"];
</script>

<section class="card-gallery" aria-labelledby="card-gallery-title">
  <h1 id="card-gallery-title">カード表示</h1>
  <div class="cards">
    {#each cards as card (card)}
      <div class="card-example">
        <PlayingCard {card} />
        <code>{card}</code>
      </div>
    {/each}
  </div>
</section>

<style>
  .card-gallery {
    min-height: 100dvh;
    padding: 2rem var(--gutter);
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  h1 {
    margin-bottom: 1.5rem;
    font-size: 1.45rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem 0.7rem;
  }

  .card-example {
    display: grid;
    min-width: 0;
    gap: 0.45rem;
    text-align: center;
  }

  code {
    color: var(--muted);
    font-size: 0.75rem;
  }
</style>
