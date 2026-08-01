<script>
  import PlayingCard from "./components/PlayingCard.svelte";
  import { SHARP_SUITS } from "./components/card-suits.js";

  const suitCards = ["As", "Ah", "Ad", "Ac"];
</script>

<main class="suit-preview">
  <header>
    <p>採用スート</p>
    <h1>シャープ</h1>
  </header>

  <div class="four-suits" aria-label="シャープの4スート">
    {#each suitCards as card, index (card)}
      <PlayingCard
        {card}
        {index}
        variant="board"
        suitSet={SHARP_SUITS}
        animate={false}
      />
    {/each}
  </div>
</main>

<style>
  .suit-preview {
    display: grid;
    align-content: start;
    width: min(100%, var(--app-max-width));
    min-height: 100dvh;
    margin-inline: auto;
    padding: 1.5rem var(--gutter) 3rem;
    gap: 1rem;
    background:
      radial-gradient(circle at 50% 8%, var(--felt-light), transparent 18rem),
      var(--felt);
  }

  header {
    display: grid;
    gap: 0.2rem;
  }

  header p {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  h1 {
    font-size: 1.25rem;
  }

  .four-suits {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 0.85rem;
    gap: clamp(0.35rem, 1.6vw, 0.55rem);
    border: 1px solid rgb(224 181 92 / 58%);
    border-radius: 0.9rem;
    background: rgb(36 53 31 / 54%);
  }
</style>
