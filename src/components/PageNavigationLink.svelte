<script lang="ts">
  import { shouldHandleAppNavigation, type AppPath } from "../app-route.ts";

  interface Props {
    path: AppPath;
    label?: string;
    ariaLabel?: string;
    onNavigate: () => void;
  }

  let {
    path,
    label = "トップへ",
    ariaLabel = "トップページへ戻る",
    onNavigate,
  }: Props = $props();

  function followNavigation(event: MouseEvent): void {
    if (!shouldHandleAppNavigation(event)) return;
    event.preventDefault();
    onNavigate();
  }
</script>

<a
  class="page-navigation-link"
  href={path}
  onclick={followNavigation}
  aria-label={ariaLabel}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m15 18-6-6 6-6"></path>
  </svg>
  <span>{label}</span>
</a>

<style>
  .page-navigation-link {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.2rem;
    color: #dbeae4;
    font-size: 0.84rem;
    text-decoration: none;
  }

  .page-navigation-link svg {
    width: 1.15rem;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  .page-navigation-link:focus-visible {
    border-radius: 0.3rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    .page-navigation-link:hover {
      color: var(--text);
    }
  }
</style>
