<script lang="ts">
  import { shouldHandleAppNavigation, type AppPath } from "../app-route.ts";

  interface Props {
    onNavigate: (path: AppPath) => void;
  }

  let { onNavigate }: Props = $props();

  function followLink(event: MouseEvent, path: AppPath): void {
    if (!shouldHandleAppNavigation(event)) return;
    event.preventDefault();
    onNavigate(path);
  }
</script>

<footer class="site-footer">
  <p class="invitation">ご意見・ご感想お待ちしております！</p>
  <a
    class="contact-link"
    href="https://x.com/Arahabica1"
    rel="me external noopener"
    target="_blank">Xで開発者に連絡する</a
  >
  <nav aria-label="サイト情報">
    <a href="/terms" onclick={(event) => followLink(event, "/terms")}
      >利用規約</a
    >
    <a href="/credits#materials">素材</a>
    <a href="/credits#developer">開発者</a>
  </nav>
</footer>

<style>
  .site-footer {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
    width: 100%;
    padding-block: 1.8rem max(1.5rem, env(safe-area-inset-bottom));
    border-top: 1px solid rgb(255 255 255 / 11%);
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.7;
    text-align: center;
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.65rem 1.25rem;
  }

  .invitation {
    color: #c5d9d2;
    font-size: 0.82rem;
  }

  a {
    color: #dbeae4;
    text-underline-offset: 0.22em;
  }

  .contact-link {
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 650;
  }

  a:focus-visible {
    border-radius: 0.15rem;
    outline: 3px solid rgb(255 255 255 / 82%);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    a:hover {
      color: var(--text);
    }
  }
</style>
