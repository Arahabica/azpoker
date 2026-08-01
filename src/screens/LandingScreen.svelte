<script>
  import PlayingCard from "../components/PlayingCard.svelte";

  let { onStart } = $props();
</script>

<section id="landing" class="screen landing-screen" aria-labelledby="app-title">
  <div class="brand-lockup">
    <div class="logo-cards" aria-hidden="true">
      <PlayingCard card="As" index={0} variant="logo" />
      <PlayingCard card="Th" index={1} variant="logo" />
    </div>
    <h1 id="app-title">暗算ポーカー</h1>
  </div>
  <button
    id="start-game"
    class="primary-action start-action"
    type="button"
    onclick={onStart}
  >はじめる</button>
</section>
