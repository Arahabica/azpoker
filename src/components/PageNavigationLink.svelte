<script lang="ts">
  import { shouldHandleAppNavigation, type AppPath } from "../app-route.ts";
  import ChevronIcon from "./icons/ChevronIcon.svelte";

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
  <ChevronIcon direction="left" />
  <span>{label}</span>
</a>

<style>
  .page-navigation-link {
    --chevron-icon-size: 1.15rem;

    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.2rem;
    color: #dbeae4;
    font-size: 0.84rem;
    text-decoration: none;
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
