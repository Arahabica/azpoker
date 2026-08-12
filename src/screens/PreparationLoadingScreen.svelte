<script lang="ts">
  import LoadingSpinner from "../components/LoadingSpinner.svelte";

  interface Props {
    delayMs: number;
  }

  let { delayMs }: Props = $props();
</script>

<section
  class="preparation-loading-screen"
  aria-label="問題を読み込んでいます"
  aria-busy="true"
>
  <LoadingSpinner {delayMs} label="問題を読み込んでいます" />
</section>

<style>
  .preparation-loading-screen {
    display: grid;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    place-items: center;
    pointer-events: none;
  }
</style>
