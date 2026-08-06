const APP_PATHS = ["/", "/history", "/terms", "/credits"] as const;
const SITE_ORIGIN = "https://azpoker.me";
const OGP_IMAGE_URL = `${SITE_ORIGIN}/ogp.png`;

type AppPath = (typeof APP_PATHS)[number];

interface PageMetadata {
  title: string;
  description: string;
}

const PAGE_METADATA: Readonly<Record<AppPath, PageMetadata>> = Object.freeze({
  "/": {
    title: "暗算ポーカー｜勝率と確率のドリル",
    description:
      "ポーカーの確率とハンドの強さを2択で鍛える、制限時間付き10問の暗算ドリル。",
  },
  "/history": {
    title: "履歴｜暗算ポーカー",
    description: "暗算ポーカーで挑戦した直近50回の結果を確認できます。",
  },
  "/terms": {
    title: "利用規約｜暗算ポーカー",
    description: "暗算ポーカーの利用条件と情報の取り扱いについて。",
  },
  "/credits": {
    title: "素材・開発者｜暗算ポーカー",
    description: "暗算ポーカーで使用している素材、ライセンス、開発者について。",
  },
});

function normalizeAppPath(pathname: string): AppPath {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  const normalized =
    withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
  return APP_PATHS.includes(normalized as AppPath)
    ? (normalized as AppPath)
    : "/";
}

function getPageMetadata(path: AppPath): PageMetadata {
  return PAGE_METADATA[path];
}

function getCanonicalUrl(path: AppPath): string {
  return new URL(path, SITE_ORIGIN).href;
}

function shouldHandleAppNavigation(event: MouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export {
  APP_PATHS,
  OGP_IMAGE_URL,
  SITE_ORIGIN,
  getCanonicalUrl,
  getPageMetadata,
  normalizeAppPath,
  shouldHandleAppNavigation,
};
export type { AppPath, PageMetadata };
