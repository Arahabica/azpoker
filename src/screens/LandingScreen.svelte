<script>
  import ActionButton from "../components/ActionButton.svelte";
  import LogoCards from "../components/LogoCards.svelte";

  let { onStart, starting = false } = $props();
</script>

<section id="landing" class="landing-screen" aria-labelledby="app-title">
  <div class="brand-lockup">
    <LogoCards />
    <h1 id="app-title">暗算ポーカー</h1>
  </div>
  <div class="start-action">
    <ActionButton id="start-game" label="はじめる" onClick={onStart} disabled={starting} />
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
    line-height: 1;
    white-space: nowrap;
    text-shadow: 0 0.15rem 0.5rem rgb(0 0 0 / 18%);
  }

  .start-action {
    width: min(100%, 18rem);
    flex: 0 0 auto;
  }
</style>
