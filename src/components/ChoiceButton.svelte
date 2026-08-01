<script>
  let { value, disabled = false, onSelect } = $props();

  const text = $derived(String(value));
  const number = $derived(text.endsWith("%") ? text.slice(0, -1) : text);
  const suffix = $derived(text.endsWith("%") ? "%" : "");
</script>

<button
  class="choice"
  type="button"
  {disabled}
  onclick={() => onSelect(value)}
>
  <span class="choice-content">
    <span class="choice-qualifier">約</span>
    <span class="choice-value">{number}</span>
    {#if suffix}
      <span class="choice-percent">{suffix}</span>
    {/if}
  </span>
</button>

<style>
  .choice {
    display: grid;
    width: 100%;
    min-width: 0;
    min-height: 4rem;
    padding: 0.5rem 0.75rem 0.66rem 0.75rem;
    place-items: center;
    border: 1px solid rgb(255 255 255 / 23%);
    border-radius: 1rem;
    background: rgb(2 33 25 / 68%);
    color: var(--text);
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 8%),
      0 0.55rem 1.1rem rgb(0 35 27 / 14%);
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background 120ms ease;
  }

  .choice-content {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    line-height: 1;
  }

  .choice-qualifier,
  .choice-percent {
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 650;
  }

  .choice-value {
    margin-left: 5px;
    font-size: clamp(1.35rem, 6.5vw, 1.75rem);
    font-weight: 400;
    letter-spacing: -0.035em;
    font-variant-numeric: tabular-nums;
  }

  .choice-percent {
    margin-left: 5px;
  }

  @media (hover: hover) {
    .choice:hover {
      border-color: rgb(255 255 255 / 48%);
      background: rgb(2 33 25 / 82%);
      transform: translateY(-1px);
    }
  }
</style>
