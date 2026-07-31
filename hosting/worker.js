/**
 * Sites向けの静的配信エントリーポイント。
 * ルートだけ index.html に解決し、その他はビルド済みアセットへ渡す。
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      url.pathname = "/index.html";
    }

    return env.ASSETS.fetch(new Request(url, request));
  },
};
