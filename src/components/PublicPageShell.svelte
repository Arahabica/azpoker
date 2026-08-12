<script lang="ts">
  import type { Snippet } from "svelte";

  import type { AppPath } from "../app-route.ts";
  import PageNavigationLink from "./PageNavigationLink.svelte";
  import SiteFooter from "./SiteFooter.svelte";

  interface Props {
    title: string;
    lead?: string;
    updatedAt?: string;
    showHeading?: boolean;
    immersiveBody?: boolean;
    navigationPath?: AppPath;
    navigationLabel?: string;
    navigationAriaLabel?: string;
    onNavigate: (path: AppPath) => void;
    onHeaderNavigate?: (path: AppPath) => void;
    children: Snippet;
  }

  let {
    title,
    lead = "",
    updatedAt = "",
    showHeading = true,
    immersiveBody = false,
    navigationPath = "/",
    navigationLabel = "トップへ",
    navigationAriaLabel = "トップページへ戻る",
    onNavigate,
    onHeaderNavigate,
    children,
  }: Props = $props();

  function followNavigation(): void {
    (onHeaderNavigate ?? onNavigate)(navigationPath);
  }
</script>

<section class="public-page" aria-labelledby="public-page-title">
  <header class="page-header">
    <PageNavigationLink
      path={navigationPath}
      label={navigationLabel}
      ariaLabel={navigationAriaLabel}
      onNavigate={followNavigation}
    />
  </header>

  {#if showHeading}
    <div class="heading">
      <h1 id="public-page-title" tabindex="-1">{title}</h1>
      {#if lead}
        <p>{lead}</p>
      {/if}
      {#if updatedAt}
        <p class="updated-at">最終更新: {updatedAt}</p>
      {/if}
    </div>
  {:else}
    <h1 id="public-page-title" class="visually-hidden" tabindex="-1">
      {title}
    </h1>
  {/if}

  <div class="page-body" class:is-immersive={immersiveBody}>
    {@render children()}
  </div>

  <SiteFooter {onNavigate} />
</section>

<style>
  .public-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: max(1rem, env(safe-area-inset-top)) var(--gutter) 0;
    font-family:
      -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI",
      "Meiryo UI", sans-serif;
  }

  .page-header {
    min-height: 3rem;
  }

  .heading {
    display: grid;
    gap: 0.8rem;
    padding-block: 1.2rem 2.2rem;
  }

  .heading h1 {
    color: var(--text);
    font-size: clamp(1.8rem, 8vw, 2.35rem);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.3;
  }

  .heading p {
    max-width: 38rem;
    color: #c5d9d2;
    font-size: 0.93rem;
    line-height: 1.85;
  }

  .heading .updated-at {
    color: var(--muted);
    font-size: 0.76rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .page-body {
    display: grid;
    flex: 1;
    align-content: start;
    gap: 1rem;
    width: 100%;
    padding-bottom: 3rem;
  }

  .page-body:not(.is-immersive) :global(section) {
    padding: 1.25rem;
    border: 1px solid rgb(255 255 255 / 11%);
    border-radius: 1.15rem;
    background: rgb(2 42 32 / 45%);
    box-shadow: inset 0 1px rgb(255 255 255 / 4%);
  }

  .page-body:not(.is-immersive) :global(h2:not(.history-panel-title)) {
    margin: 0 0 0.75rem;
    color: var(--text);
    font-size: 1.08rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.55;
  }

  .page-body:not(.is-immersive) :global(h3) {
    margin: 1.2rem 0 0.45rem;
    color: var(--text);
    font-size: 0.94rem;
    line-height: 1.6;
  }

  .page-body:not(.is-immersive) :global(p),
  .page-body:not(.is-immersive) :global(li) {
    color: #c5d9d2;
    font-size: 0.88rem;
    line-height: 1.9;
  }

  .page-body:not(.is-immersive) :global(p + p) {
    margin-top: 0.7rem;
  }

  .page-body:not(.is-immersive) :global(ul),
  .page-body:not(.is-immersive) :global(ol:not(.history-list)) {
    margin: 0;
    padding-left: 1.4rem;
  }

  .page-body:not(.is-immersive) :global(a) {
    color: #f7dd70;
    text-underline-offset: 0.22em;
  }

  .page-body:not(.is-immersive) :global(a:focus-visible) {
    border-radius: 0.15rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    .page-body:not(.is-immersive) :global(a:hover) {
      color: #fff0aa;
    }
  }
</style>
