const APP_PATHS = ["/", "/history", "/terms", "/credits"] as const;
const SITE_ORIGIN = "https://azpoker.me";
const OGP_IMAGE_URL = `${SITE_ORIGIN}/ogp.png`;
const HISTORY_DETAIL_PREFIX = "/history/";
const HISTORY_DETAIL_ORIGIN_STATE_KEY = "anzanPokerHistoryOrigin";

type StaticAppPath = (typeof APP_PATHS)[number];
type HistoryDetailPath = `/history/${string}`;
type AppPath = StaticAppPath | HistoryDetailPath;
type HistoryDetailOrigin = "top" | "history" | "direct";
type HistoryDetailSource = Exclude<HistoryDetailOrigin, "direct">;

interface PageMetadata {
  title: string;
  description: string;
}

interface HistoryDetailNavigation {
  path: "/" | "/history";
  label: "トップへ" | "履歴一覧へ戻る";
  ariaLabel: "トップページへ戻る" | "履歴一覧へ戻る";
}

const PAGE_METADATA: Readonly<Record<StaticAppPath, PageMetadata>> =
  Object.freeze({
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
      description:
        "暗算ポーカーで使用している素材、ライセンス、開発者について。",
    },
  });

const HISTORY_DETAIL_METADATA: Readonly<PageMetadata> = Object.freeze({
  title: "履歴詳細｜暗算ポーカー",
  description: "暗算ポーカーで回答した問題と解説を振り返ります。",
});

function getHistoryIdFromPath(pathname: string): string | null {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  const normalized =
    withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
  if (!normalized.startsWith(HISTORY_DETAIL_PREFIX)) return null;

  const encodedId = normalized.slice(HISTORY_DETAIL_PREFIX.length);
  if (!encodedId || encodedId.includes("/")) return null;

  try {
    const id = decodeURIComponent(encodedId);
    return id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

function createHistoryDetailPath(id: string): HistoryDetailPath {
  if (!id) throw new Error("履歴IDが必要です");
  return `${HISTORY_DETAIL_PREFIX}${encodeURIComponent(id)}`;
}

function isHistoryDetailPath(pathname: string): pathname is HistoryDetailPath {
  return getHistoryIdFromPath(pathname) !== null;
}

function createHistoryDetailState(
  origin: HistoryDetailSource,
): Record<typeof HISTORY_DETAIL_ORIGIN_STATE_KEY, HistoryDetailSource> {
  return { [HISTORY_DETAIL_ORIGIN_STATE_KEY]: origin };
}

function readHistoryDetailOrigin(state: unknown): HistoryDetailOrigin {
  if (!state || typeof state !== "object") return "direct";
  const origin = (state as Record<string, unknown>)[
    HISTORY_DETAIL_ORIGIN_STATE_KEY
  ];
  return origin === "top" || origin === "history" ? origin : "direct";
}

function getHistoryDetailNavigation(
  origin: HistoryDetailOrigin,
): HistoryDetailNavigation {
  return origin === "top"
    ? {
        path: "/",
        label: "トップへ",
        ariaLabel: "トップページへ戻る",
      }
    : {
        path: "/history",
        label: "履歴一覧へ戻る",
        ariaLabel: "履歴一覧へ戻る",
      };
}

function normalizeAppPath(pathname: string): AppPath {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  const normalized =
    withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
  if (APP_PATHS.includes(normalized as StaticAppPath)) {
    return normalized as StaticAppPath;
  }
  return isHistoryDetailPath(normalized) ? normalized : "/";
}

function getPageMetadata(path: AppPath): PageMetadata {
  return isHistoryDetailPath(path)
    ? HISTORY_DETAIL_METADATA
    : PAGE_METADATA[path];
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
  HISTORY_DETAIL_ORIGIN_STATE_KEY,
  HISTORY_DETAIL_PREFIX,
  OGP_IMAGE_URL,
  SITE_ORIGIN,
  createHistoryDetailState,
  createHistoryDetailPath,
  getCanonicalUrl,
  getHistoryDetailNavigation,
  getHistoryIdFromPath,
  getPageMetadata,
  isHistoryDetailPath,
  normalizeAppPath,
  readHistoryDetailOrigin,
  shouldHandleAppNavigation,
};
export type {
  AppPath,
  HistoryDetailNavigation,
  HistoryDetailOrigin,
  HistoryDetailPath,
  HistoryDetailSource,
  PageMetadata,
  StaticAppPath,
};
