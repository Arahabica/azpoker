<script lang="ts">
  import { onMount } from "svelte";

  import ActionButton from "./ActionButton.svelte";

  interface Props {
    onConfirmLeave: () => void;
    onContinue: () => void;
  }

  let { onConfirmLeave, onContinue }: Props = $props();

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onContinue();
      return;
    }
    if (event.key !== "Tab") return;

    const buttons = [
      ...document.querySelectorAll<HTMLButtonElement>(
        ".leave-sheet .action-button",
      ),
    ];
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  onMount(() => {
    document
      .querySelector<HTMLButtonElement>("#continue-quiz")
      ?.focus({ preventScroll: true });
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="leave-dialog-layer">
  <button
    class="leave-backdrop"
    type="button"
    tabindex="-1"
    aria-label="問題を続ける"
    onclick={onContinue}
  ></button>
  <div
    class="leave-sheet"
    role="dialog"
    aria-modal="true"
    aria-labelledby="leave-title"
  >
    <span class="sheet-handle" aria-hidden="true"></span>
    <h2 id="leave-title">問題を終了しますか？</h2>
    <div class="leave-actions">
      <ActionButton
        id="confirm-leave"
        label="トップページに戻る"
        variant="danger"
        onClick={onConfirmLeave}
      />
      <ActionButton
        id="continue-quiz"
        label="問題を続ける"
        onClick={onContinue}
      />
    </div>
  </div>
</div>

<style>
  .leave-dialog-layer {
    position: fixed;
    inset: 0;
    z-index: 20;
    width: min(100%, var(--app-max-width));
    margin-inline: auto;
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
  }

  .leave-backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    padding: 0;
    border: 0;
    background: rgb(0 15 12 / 62%);
    cursor: default;
    animation: reveal-backdrop 180ms ease-out both;
  }

  .leave-sheet {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    padding:
      0.7rem
      var(--gutter)
      max(1.15rem, env(safe-area-inset-bottom));
    border-top: 1px solid rgb(255 255 255 / 12%);
    border-radius: 1.55rem 1.55rem 0 0;
    background: #11211d;
    box-shadow: 0 -1.5rem 3rem rgb(0 15 12 / 56%);
    text-align: center;
    animation: raise-leave-sheet 240ms cubic-bezier(0.2, 0.76, 0.28, 1) both;
  }

  .sheet-handle {
    display: block;
    width: 2.6rem;
    height: 0.28rem;
    margin: 0 auto 1.15rem;
    border-radius: 999px;
    background: rgb(255 255 255 / 19%);
  }

  h2 {
    color: var(--text);
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1.45;
  }

  .leave-actions {
    display: grid;
    gap: 0.85rem;
    margin-top: 1.35rem;
  }

  @keyframes reveal-backdrop {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes raise-leave-sheet {
    from {
      opacity: 0;
      transform: translateY(100%);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
