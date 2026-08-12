<script lang="ts">
  import { shouldHandleAppNavigation } from "../app-route.ts";
  import ActionButton from "../components/ActionButton.svelte";
  import LeaveIcon from "../components/icons/LeaveIcon.svelte";
  import SoundIcon from "../components/icons/SoundIcon.svelte";

  interface Props {
    soundEnabled: boolean;
    ready?: boolean;
    error?: string;
    onSoundChange: (enabled: boolean) => void;
    onStart: () => void;
    onRetry: () => void;
    onHome: () => void;
  }

  let {
    soundEnabled,
    ready = false,
    error = "",
    onSoundChange,
    onStart,
    onRetry,
    onHome,
  }: Props = $props();

  function returnHome(event: MouseEvent): void {
    if (!shouldHandleAppNavigation(event)) return;
    event.preventDefault();
    onHome();
  }
</script>

<section id="prepare" class="prepare-screen" aria-labelledby="prepare-title">
  <header class="prepare-header">
    <a class="prepare-home-link" href="/" onclick={returnHome}>
      <LeaveIcon />
      <span>トップに戻る</span>
    </a>
  </header>

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
        <SoundIcon enabled={soundEnabled} />
      </span>
      <span class="sound-label">{soundEnabled ? "音あり" : "音なし"}</span>
    </button>

    {#if error}
      <p class="prepare-status is-error" role="alert">{error}</p>
    {/if}
  </div>

  <div class="prepare-action">
    {#if error}
      <ActionButton
        id="retry-load"
        label="もう一度読み込む"
        onClick={onRetry}
      />
    {:else}
      <ActionButton
        id="start-quiz"
        label="スタート"
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
    padding: max(1rem, env(safe-area-inset-top)) var(--gutter)
      max(2rem, env(safe-area-inset-bottom));
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
    animation: prepare-screen-fade-in 200ms ease-out both;
  }

  .prepare-header {
    display: flex;
    width: 100%;
    min-height: 3rem;
    justify-content: flex-end;
  }

  .prepare-home-link {
    --leave-icon-size: 1.25rem;
    --leave-icon-opacity: 0.68;

    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.4rem;
    color: #dbeae4;
    font-size: 0.84rem;
    text-decoration: none;
  }

  .prepare-home-link:focus-visible {
    border-radius: 0.3rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
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

  .sound-label {
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 800;
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
    .prepare-home-link:hover {
      --leave-icon-opacity: 0.9;

      color: var(--text);
    }

    .sound-toggle:hover .sound-icon {
      background: linear-gradient(180deg, #6c8079, #586d65);
    }

    .sound-toggle.is-enabled:hover .sound-icon {
      background: linear-gradient(180deg, #8c9c96, #72867f);
    }
  }

  @keyframes prepare-screen-fade-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .prepare-screen {
      animation: none;
    }
  }
</style>
