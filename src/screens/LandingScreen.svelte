<script lang="ts">
  import { shouldHandleAppNavigation, type AppPath } from "../app-route.ts";
  import ActionButton from "../components/ActionButton.svelte";
  import HistoryPanel from "../components/HistoryPanel.svelte";
  import HoldemOverview from "../components/HoldemOverview.svelte";
  import LandingQuizPreview from "../components/LandingQuizPreview.svelte";
  import LogoCards from "../components/LogoCards.svelte";
  import PreflopEquityChart from "../components/PreflopEquityChart.svelte";
  import SiteFooter from "../components/SiteFooter.svelte";
  import type { QuizHistoryEntry } from "../result-history.ts";

  interface Props {
    history: readonly QuizHistoryEntry[];
    onStart: () => void;
    onNavigate: (path: AppPath) => void;
    onOpenHistory: (id: string) => void;
  }

  let { history, onStart, onNavigate, onOpenHistory }: Props = $props();

  const recentHistory = $derived(history.slice(0, 2));
  const showMoreHistory = $derived(history.length > 2);

  function showHistory(event: MouseEvent): void {
    if (!shouldHandleAppNavigation(event)) return;
    event.preventDefault();
    onNavigate("/history");
  }

  function openHistory(entry: QuizHistoryEntry): void {
    onOpenHistory(entry.id);
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

    <div class="recent-history-slot" data-testid="recent-history-slot">
      {#if recentHistory.length > 0}
        <HistoryPanel
          entries={recentHistory}
          showMore={showMoreHistory}
          onShowMore={showHistory}
          onSelect={openHistory}
        />
      {/if}
    </div>

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

      <div class="training-value">
        <div class="training-copy">
          <p class="training-lead">
            カードを見た瞬間に確率が浮かぶようになればプレーはもっと楽しくなります。
          </p>
          <p>
            このアプリはテキサスホールデムの10問の確率問題を制限時間付きで解いていくクイズアプリです。
          </p>
          <p>
            ちょっとしたスキマ時間にプレイして、ポーカーの基礎体力を上げていきましょう。
          </p>
          <p>
            テキサスホールデムって何？<wbr />という方はこちら ↓
          </p>
        </div>
      </div>

      <div class="holdem-section">
        <HoldemOverview />
      </div>

      <section class="appendix-section" aria-labelledby="appendix-title">
        <h2 id="appendix-title">付録</h2>
        <PreflopEquityChart />
      </section>

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
    min-height: 100vh;
    min-height: 100dvh;
    padding: 24px var(--lp-padding-horizontal) 60px var(--lp-padding-horizontal);
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Landing", sans-serif;
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

  .recent-history-slot {
    width: 100%;
    min-height: 11.5rem;
  }

  .landing-body {
    width: 100%;
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Landing Body", sans-serif;
  }

  .landing-content {
    display: grid;
    width: 100%;
    min-height: 100dvh;
    padding: 0 var(--lp-padding-horizontal) 3.5rem;
  }

  .training-value {
    display: grid;
    gap: 1.4rem;
    /* padding: 2.5rem 0.2rem 0; */
    padding: 24px 0 60px 0;
  }

  .training-lead,
  .training-copy p {
    color: #c5d9d2;
    font-size: 0.9rem;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1.95;
    text-align: left;
  }

  .training-copy {
    display: grid;
    gap: 1.1rem;
  }

  .holdem-section {
    margin-top: 1.25rem;
  }

  .appendix-section {
    display: grid;
    gap: 1rem;
    margin-top: 3.5rem;
  }

  .appendix-section > h2 {
    color: var(--text);
    font-size: 1.35rem;
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.5;
  }

  .closing-action {
    justify-self: center;
    width: min(100%, 18rem);
    margin-block: 5rem 2.5rem;
  }

  :global(html[data-ogp-capture]) .landing-screen,
  :global(html[data-ogp-capture]) .landing-hero {
    height: 630px;
    min-height: 630px;
  }

  :global(html[data-ogp-capture]) .landing-screen {
    overflow: hidden;
  }

  :global(html[data-ogp-capture]) .landing-hero {
    padding: 0;
  }

  :global(html[data-ogp-capture]) .brand-lockup {
    --logo-cards-height: 15rem;
    --logo-card-width: 9.5rem;
    --logo-card-overlap: -2.1rem;
    --card-reveal-duration: 0.01ms;
    flex: none;
    align-content: center;
    width: 100%;
    height: 100%;
    gap: 1.75rem;
    padding: 0 4rem;
  }

  :global(html[data-ogp-capture]) .brand-lockup h1 {
    font-size: 5.25rem;
    letter-spacing: -0.045em;
    text-shadow: 0 0.3rem 0.9rem rgb(0 0 0 / 22%);
  }

  :global(html[data-ogp-capture]) .brand-copy {
    gap: 1.1rem;
  }

  :global(html[data-ogp-capture]) .tagline {
    display: block;
    font-size: 1.65rem;
    letter-spacing: 0.025em;
  }

  :global(html[data-ogp-capture]) .tagline span + span::before {
    content: " ";
  }

  :global(html[data-ogp-capture]) .start-action,
  :global(html[data-ogp-capture] .history-panel),
  :global(html[data-ogp-capture]) .landing-body {
    display: none;
  }
</style>
