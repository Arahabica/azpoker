<script>
  import ActionButton from "../components/ActionButton.svelte";

  let {
    soundEnabled,
    loading = false,
    ready = false,
    error = "",
    onSoundChange,
    onStart,
    onRetry,
  } = $props();
</script>

<section
  id="prepare"
  class="prepare-screen"
  aria-labelledby="prepare-title"
>
  <h1 id="prepare-title" tabindex="-1">問題を開始します</h1>

  <div class="prepare-controls">
    <button
      id="sound-toggle"
      class="sound-toggle"
      class:is-enabled={soundEnabled}
      type="button"
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "音をなしにする" : "音をありにする"}
      onclick={() => onSoundChange(!soundEnabled)}
    >
      <span class="sound-icon" aria-hidden="true">
        {#if soundEnabled}
          <svg viewBox="0 0 24 24">
            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298Z"></path>
            <path d="M16 9a5 5 0 0 1 0 6"></path>
            <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24">
            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298Z"></path>
            <line x1="22" x2="16" y1="9" y2="15"></line>
            <line x1="16" x2="22" y1="9" y2="15"></line>
          </svg>
        {/if}
      </span>
      <span class="sound-label">{soundEnabled ? "音あり" : "音なし"}</span>
    </button>

    <div class="prepare-status-slot">
      {#if error}
        <p class="prepare-status is-error" role="alert">{error}</p>
      {:else if loading}
        <p class="prepare-status" role="status" aria-live="polite">
          問題を読み込んでいます
        </p>
      {/if}
    </div>
  </div>

  <div class="prepare-action">
    {#if error}
      <ActionButton id="retry-load" label="もう一度読み込む" onClick={onRetry} />
    {:else}
      <ActionButton
        id="start-quiz"
        label={loading ? "準備中…" : "スタート"}
        onClick={onStart}
        disabled={!ready}
      />
    {/if}
  </div>
</section>

<style>
  .prepare-screen {
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
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .prepare-screen h1 {
    margin-top: clamp(2rem, 10vh, 5rem);
    color: var(--text);
    font-size: clamp(1.65rem, 7.5vw, 2.15rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.4;
    text-align: center;
  }

  .prepare-screen h1:focus {
    outline: none;
  }

  .prepare-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    margin-top: auto;
    padding-bottom: clamp(2rem, 7vh, 3.5rem);
  }

  .sound-toggle {
    display: grid;
    gap: 0.7rem;
    min-width: 6.5rem;
    padding: 0.35rem;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }

  .sound-icon {
    display: grid;
    width: 4.65rem;
    aspect-ratio: 1;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: linear-gradient(180deg, #5f746d, #4d625b);
    box-shadow:
      inset 0 1px rgb(255 255 255 / 15%),
      0 0.3rem 0 #314941,
      0 0.75rem 1.4rem rgb(0 35 26 / 22%);
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      background 160ms ease,
      color 160ms ease;
  }

  .is-enabled .sound-icon {
    background: linear-gradient(180deg, #81928c, #697e76);
    color: #f1f5f3;
  }

  .sound-toggle:not(.is-enabled) .sound-icon {
    background: linear-gradient(180deg, #566a63, #495c55);
    box-shadow:
      inset 0 1px rgb(255 255 255 / 9%),
      0 0.08rem 0 #314941,
      0 0.35rem 0.8rem rgb(0 35 26 / 18%);
    color: #d3ddda;
    transform: translateY(0.22rem);
  }

  .sound-toggle:active .sound-icon {
    box-shadow:
      inset 0 1px rgb(255 255 255 / 10%),
      0 0.08rem 0 #314941,
      0 0.35rem 0.8rem rgb(0 35 26 / 18%);
    transform: translateY(0.22rem);
  }

  .sound-icon svg {
    width: 2.25rem;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  .sound-label {
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 800;
  }

  .prepare-status-slot {
    min-height: 1.5em;
  }

  .prepare-status {
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.5;
    text-align: center;
  }

  .prepare-status.is-error {
    color: #ffd0d2;
  }

  .prepare-action {
    width: min(100%, 18rem);
    flex: 0 0 auto;
  }

  @media (hover: hover) {
    .sound-toggle:hover .sound-icon {
      background: linear-gradient(180deg, #6c8079, #586d65);
    }

    .sound-toggle.is-enabled:hover .sound-icon {
      background: linear-gradient(180deg, #8c9c96, #72867f);
    }
  }
</style>
