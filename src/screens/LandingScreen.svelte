<script>
  import ActionButton from "../components/ActionButton.svelte";
  import PlayingCard from "../components/PlayingCard.svelte";

  let { onStart } = $props();
</script>

<section id="landing" class="landing-screen" aria-labelledby="app-title">
  <div class="brand-lockup">
    <div class="logo-cards" aria-hidden="true">
      <div class="logo-card">
        <PlayingCard card="As" index={0} variant="logo" />
      </div>
      <div class="logo-card">
        <PlayingCard card="Th" index={1} variant="logo" />
      </div>
    </div>
    <h1 id="app-title">暗算ポーカー</h1>
  </div>
  <div class="start-action">
    <ActionButton id="start-game" label="はじめる" onClick={onStart} />
  </div>
</section>

<style>
  .landing-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding:
      max(2rem, env(safe-area-inset-top))
      var(--gutter)
      max(2rem, env(safe-area-inset-bottom));
    font-family: "Kosugi Maru Landing", sans-serif;
  }

  .brand-lockup {
    display: grid;
    flex: 1;
    place-items: center;
    align-content: center;
    gap: 2.2rem;
    width: 100%;
    padding-bottom: 3rem;
  }

  .brand-lockup h1 {
    font-size: clamp(2.1rem, 10vw, 2.9rem);
    font-weight: 400;
    letter-spacing: -0.055em;
    text-shadow: 0 0.15rem 0.5rem rgb(0 0 0 / 18%);
  }

  .logo-cards {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 8.5rem;
  }

  .logo-card + .logo-card {
    margin-left: -1.15rem;
  }

  .start-action {
    width: min(100%, 18rem);
    flex: 0 0 auto;
  }
</style>
