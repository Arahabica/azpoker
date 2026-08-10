import { hydrate, mount } from "svelte";

import "../styles.css";
import App from "./App.svelte";
import { normalizeAppPath } from "./app-route.ts";

const isOgpCapture =
  new URLSearchParams(window.location.search).get("capture") === "ogp";
document.documentElement.toggleAttribute("data-ogp-capture", isOgpCapture);

const target = document.querySelector("#app");

if (!target) {
  throw new Error("アプリの描画先が見つかりません");
}

const initialPath = normalizeAppPath(window.location.pathname);
const serverPath =
  target.querySelector<HTMLElement>(".app-shell")?.dataset.appPath;
const shouldHydrate = serverPath === initialPath;
if (!shouldHydrate) {
  target.replaceChildren();
}
const renderApp = shouldHydrate ? hydrate : mount;

renderApp(App, {
  target,
  props: { initialPath },
});
