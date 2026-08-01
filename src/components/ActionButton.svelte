<script>
  let {
    id,
    label,
    variant = "primary",
    onClick,
  } = $props();
</script>

<button
  {id}
  class="action-button"
  class:primary={variant === "primary"}
  class:secondary={variant === "secondary"}
  type="button"
  onclick={onClick}
>{label}</button>

<style>
  .action-button {
    width: 100%;
    min-height: 3.7rem;
    border-radius: 1rem;
    cursor: pointer;
    font-weight: 800;
    letter-spacing: 0.01em;
    transition:
      transform 120ms ease,
      background 120ms ease,
      border-color 120ms ease;
  }

  .primary {
    border: 1px solid rgb(255 255 255 / 20%);
    background: var(--accent);
    color: var(--accent-ink);
    box-shadow:
      0 0.3rem 0 var(--accent-pressed),
      0 0.8rem 1.7rem rgb(0 30 22 / 22%);
  }

  .primary:active {
    transform: translateY(0.18rem);
    box-shadow:
      0 0.12rem 0 var(--accent-pressed),
      0 0.45rem 1rem rgb(0 30 22 / 18%);
  }

  .secondary {
    border: 1px solid rgb(255 255 255 / 22%);
    background: rgb(2 33 25 / 52%);
    color: var(--text);
  }

  @media (hover: hover) {
    .primary:hover {
      background: var(--accent-hover);
    }

    .secondary:hover {
      border-color: rgb(255 255 255 / 48%);
      background: rgb(2 33 25 / 82%);
      transform: translateY(-1px);
    }
  }
</style>
