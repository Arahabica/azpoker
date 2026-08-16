<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";

  import ActionButton from "../components/ActionButton.svelte";
  import { createSoundEffects, type SoundEffects } from "../sound-effects.ts";
  import ResultScreen from "../screens/ResultScreen.svelte";

  let started = $state(false);
  let replayKey = $state(0);
  let soundEffects: SoundEffects | undefined;

  function ensureSoundEffects(): SoundEffects | undefined {
    if (soundEffects) return soundEffects;
    try {
      soundEffects = createSoundEffects();
      return soundEffects;
    } catch {
      return undefined;
    }
  }

  async function replay(): Promise<void> {
    const effects = ensureSoundEffects();
    effects?.stopAll();
    const soundReady = effects
      ? Promise.all([effects.resume(), effects.load("perfect")])
      : Promise.resolve([false, null] as const);

    started = false;
    await tick();
    const [running, buffer] = await soundReady;
    replayKey += 1;
    started = true;
    await tick();
    if (effects && running && buffer) {
      effects.start("perfect", buffer);
    }
  }

  function reset(): void {
    soundEffects?.stopAll();
    started = false;
  }

  onMount(() => {
    void ensureSoundEffects()?.load("perfect");
  });

  onDestroy(() => soundEffects?.destroy());
</script>

{#if started}
  {#key replayKey}
    <ResultScreen
      score={10}
      total={10}
      elapsedMs={30_000}
      timeLimitMs={95_000}
      timeoutCount={0}
      onRetry={replay}
      onHome={reset}
    />
  {/key}
{:else}
  <section class="preview-launcher" aria-labelledby="preview-title">
    <div class="preview-copy">
      <h2 id="preview-title">全問正解の演出確認</h2>
      <p>音量を確認してから再生してください。約2.3秒後に結果が現れます。</p>
    </div>
    <ActionButton
      id="replay-perfect-result"
      label="全問正解を再現する"
      onClick={replay}
    />
  </section>
{/if}

<style>
  .preview-launcher {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: max(2rem, env(safe-area-inset-top)) var(--gutter)
      max(2rem, env(safe-area-inset-bottom));
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .preview-copy {
    display: grid;
    flex: 1;
    align-content: center;
    gap: 0.7rem;
    text-align: center;
  }

  .preview-copy h2 {
    color: var(--text);
    font-size: 1.55rem;
    line-height: 1.45;
  }

  .preview-copy p {
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.6;
  }
</style>
