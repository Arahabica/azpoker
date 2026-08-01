<script>
  import ActionButton from "../components/ActionButton.svelte";

  let { score, total, onRetry, onHome } = $props();
</script>

<section id="result" class="result-screen" aria-labelledby="result-title">
  <div class="result-content">
    <h2 id="result-title">結果</h2>
    <p class="score">{score} / {total}</p>
  </div>
  <div class="result-actions">
    <ActionButton id="retry" label="もう一度" onClick={onRetry} />
    <ActionButton id="back-home" label="トップへ" variant="secondary" onClick={onHome} />
  </div>
</section>

<style>
  .result-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding:
      max(2rem, env(safe-area-inset-top))
      var(--gutter)
      max(2rem, env(safe-area-inset-bottom));
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .result-content {
    display: grid;
    flex: 1;
    place-items: center;
    align-content: center;
    gap: 1.1rem;
    text-align: center;
  }

  .result-content h2 {
    color: rgb(255 255 255 / 75%);
    font-size: 0.9rem;
    letter-spacing: 0.16em;
  }

  .score {
    color: var(--text);
    font-size: clamp(4.2rem, 22vw, 6.2rem);
    font-weight: 400;
    letter-spacing: -0.075em;
    text-shadow: 0 0.35rem 1.2rem rgb(0 38 29 / 22%);
  }

  .result-actions {
    display: grid;
    flex: 0 0 auto;
    gap: 0.85rem;
    width: 100%;
  }
</style>
