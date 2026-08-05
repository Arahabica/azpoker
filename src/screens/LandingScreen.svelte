<script lang="ts">
  import { shouldHandleAppNavigation, type AppPath } from "../app-route.ts";
  import ActionButton from "../components/ActionButton.svelte";
  import HistoryList from "../components/HistoryList.svelte";
  import HoldemOverview from "../components/HoldemOverview.svelte";
  import LandingQuizPreview from "../components/LandingQuizPreview.svelte";
  import LogoCards from "../components/LogoCards.svelte";
  import SiteFooter from "../components/SiteFooter.svelte";
  import type { QuizHistoryEntry } from "../result-history.ts";

  interface Props {
    history: readonly QuizHistoryEntry[];
    onStart: () => void;
    onNavigate: (path: AppPath) => void;
  }

  let { history, onStart, onNavigate }: Props = $props();

  const recentHistory = $derived(history.slice(0, 2));

  function showHistory(event: MouseEvent): void {
    if (!shouldHandleAppNavigation(event)) return;
    event.preventDefault();
    onNavigate("/history");
  }
</script>

<section id="landing" class="landing-screen" aria-labelledby="app-title">
  <div class="landing-hero">
    <div class="brand-lockup">
      <LogoCards />
      <div class="brand-copy">
        <h1 id="app-title">暗算ポーカー</h1>
        <p class="tagline">
          <span>確率を瞬時に判断して、</span>
          <span>もっと強くなろう！</span>
        </p>
      </div>
    </div>

    {#if recentHistory.length > 0}
      <section class="history-panel" aria-labelledby="recent-history-title">
        <div class="section-heading">
          <h2 id="recent-history-title">最近の履歴</h2>
          <a href="/history" onclick={showHistory}>もっと見る</a>
        </div>
        <HistoryList entries={recentHistory} compact />
      </section>
    {/if}

    <div class="start-action">
      <ActionButton
        id="start-game"
        label="クイズをはじめる"
        onClick={onStart}
      />
    </div>
  </div>

  <div class="landing-body">
    <div class="landing-content">
      <LandingQuizPreview />

      <section class="training-value" aria-labelledby="training-value-title">
        <h2 id="training-value-title">
          カードを見た瞬間に<wbr />確率が浮かぶように。
        </h2>
        <p>
          フラッシュやストレートの確率、相手がカードを持っている可能性、2つの手札の勝率。クイズを繰り返して、実戦で迷わない判断力を鍛えます。
        </p>
      </section>

      <HoldemOverview />

      <div class="closing-action">
        <ActionButton
          id="start-game-bottom"
          label="クイズをはじめる"
          onClick={onStart}
        />
      </div>

      <SiteFooter {onNavigate} />
    </div>
  </div>
</section>

<style>
  .landing-screen {
    width: 100%;
  }

  .landing-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-height: calc(100vh - 90px);
    min-height: calc(100svh - 90px);
    padding: max(1.5rem, env(safe-area-inset-top)) var(--gutter)
      max(1.5rem, env(safe-area-inset-bottom));
    font-family: "Kosugi Maru Landing", sans-serif;
  }

  .landing h2 {
    font-size: 24px;
  }

  .brand-lockup {
    display: grid;
    flex: 1;
    place-items: center;
    align-content: center;
    gap: 1.5rem;
    width: 100%;
    padding-bottom: 1.5rem;
  }

  .brand-copy {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
  }

  .brand-lockup h1 {
    font-size: clamp(2.1rem, 10vw, 2.9rem);
    font-weight: 400;
    letter-spacing: -0.055em;
    line-height: 1;
    white-space: nowrap;
    text-shadow: 0 0.15rem 0.5rem rgb(0 0 0 / 18%);
  }

  .tagline {
    display: grid;
    gap: 0.15rem;
    color: #e4f0ec;
    font-size: clamp(0.88rem, 4vw, 1.02rem);
    letter-spacing: 0.015em;
    line-height: 1.65;
    text-align: center;
    text-shadow: 0 0.12rem 0.4rem rgb(0 0 0 / 16%);
  }

  .start-action {
    width: min(100%, 18rem);
    flex: 0 0 auto;
  }

  .landing-body {
    width: 100%;
    font-family:
      -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI",
      "Meiryo UI", sans-serif;
  }

  .history-panel {
    display: grid;
    gap: 1rem;
    width: 100%;
    padding-bottom: 1.5rem;
    font-family:
      -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI",
      "Meiryo UI", sans-serif;
  }

  .section-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }

  .section-heading h2 {
    color: var(--text);
    /* font-size: 1.15rem; */
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.6;
  }

  .section-heading a {
    flex: 0 0 auto;
    color: #f7dd70;
    font-size: 0.75rem;
    text-underline-offset: 0.22em;
  }

  .section-heading a:focus-visible {
    border-radius: 0.15rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
  }

  .landing-content {
    display: grid;
    gap: 5rem;
    width: 100%;
    padding: 3.5rem 2.5rem;
  }

  .training-value {
    display: grid;
    gap: 1rem;
    padding-inline: 0.2rem;
  }

  .training-value h2 {
    color: var(--text);
    /* font-size: clamp(1.55rem, 7vw, 2rem); */
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 1.55;
  }

  .training-value p {
    color: #c5d9d2;
    font-size: 0.9rem;
    line-height: 1.95;
  }

  .closing-action {
    justify-self: center;
    width: min(100%, 18rem);
    padding-block: 0.5rem 1rem;
    font-family: "Kosugi Maru Landing", sans-serif;
  }

  @media (hover: hover) {
    .section-heading a:hover {
      color: #fff0aa;
    }
  }
</style>
