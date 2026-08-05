<script lang="ts">
  import PlayingCard from "./PlayingCard.svelte";
  import type { Card } from "../types.ts";

  const COMMUNITY_CARDS: readonly Card[] = ["Ah", "7c", "Kd", "5s", "2d"];
  const HOLE_CARDS: readonly Card[] = ["Qs", "Jh"];
</script>

<section class="holdem-overview" aria-labelledby="holdem-title">
  <div class="holdem-copy">
    <h2 id="holdem-title">テキサスホールデム</h2>
    <p>このアプリで取り扱うポーカーです。</p>
    <p>
      手札2枚と、テーブルに開く5枚の共通カード。<br/>この7枚から最も強い5枚を選んで役を作る、世界で広く遊ばれているポーカーです。
    </p>
  </div>

  <div
    class="card-overview"
    role="img"
    aria-label="テーブルの共通カード5枚と手札2枚"
  >
    <div class="card-group">
      <p class="card-label">テーブルのカード 5枚</p>
      <div class="community-cards">
        {#each COMMUNITY_CARDS as card (card)}
          <div class="community-card">
            <PlayingCard {card} decorative />
          </div>
        {/each}
      </div>
    </div>

    <span class="plus" aria-hidden="true">＋</span>

    <div class="card-group">
      <p class="card-label">手札 2枚</p>
      <div class="hole-cards">
        {#each HOLE_CARDS as card, index (card)}
          <div class="hole-card" class:left={index === 0}>
            <PlayingCard {card} decorative />
          </div>
        {/each}
      </div>
    </div>
  </div>

  <a
    class="rules-link"
    href="https://www.ajpc.jp/about-poker/"
    rel="external noopener"
    target="_blank">詳しいルールはこちら <span>（AJPC・外部サイト）</span></a
  >
</section>

<style>
  .holdem-overview {
    display: grid;
    gap: 1.7rem;
    padding: 1.5rem 1.25rem;
    border: 1px solid rgb(255 255 255 / 11%);
    border-radius: 1.3rem;
    background: rgb(2 42 32 / 45%);
    box-shadow:
      inset 0 1px rgb(255 255 255 / 4%),
      0 0.8rem 2rem rgb(0 35 26 / 10%);
  }

  .holdem-copy {
    display: grid;
    gap: 0.75rem;
  }

  h2 {
    color: var(--text);
    font-size: clamp(1.35rem, 6vw, 1.7rem);
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.5;
  }

  .holdem-copy p {
    color: #c5d9d2;
    font-size: 0.9rem;
    line-height: 1.95;
  }

  .card-overview {
    display: grid;
    justify-items: center;
    gap: 0.8rem;
    padding: 1rem 0.55rem 1.2rem;
  }

  .card-group {
    display: grid;
    justify-items: center;
    gap: 0.65rem;
    width: 100%;
  }

  .card-label {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: 0.04em;
    line-height: 1.4;
  }

  .community-cards {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: clamp(0.18rem, 1vw, 0.35rem);
    width: 100%;
  }

  .community-card {
    min-width: 0;
  }

  .plus {
    color: rgb(255 255 255 / 48%);
    font-size: 1.15rem;
    line-height: 1;
  }

  .hole-cards {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 6.7rem;
  }

  .hole-card {
    width: clamp(3.9rem, 19vw, 4.9rem);
    transform: rotate(5deg);
    transform-origin: 50% 88%;
  }

  .hole-card.left {
    z-index: 1;
    transform: rotate(-5deg);
  }

  .hole-card + .hole-card {
    z-index: 2;
    margin-left: -0.85rem;
  }

  .rules-link {
    justify-self: start;
    color: #f7dd70;
    font-size: 0.82rem;
    line-height: 1.7;
    text-underline-offset: 0.25em;
  }

  .rules-link span {
    color: var(--muted);
    font-size: 0.72rem;
  }

  .rules-link:focus-visible {
    border-radius: 0.15rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    .rules-link:hover {
      color: #fff0aa;
    }
  }
</style>
