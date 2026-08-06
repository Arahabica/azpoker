import { hydrate, mount } from "svelte";

import "../styles.css";
import App from "./App.svelte";

const isOgpCapture =
  new URLSearchParams(window.location.search).get("capture") === "ogp";
document.documentElement.toggleAttribute("data-ogp-capture", isOgpCapture);

const target = document.querySelector("#app");

if (!target) {
  throw new Error("アプリの描画先が見つかりません");
}

const renderApp = target.querySelector(".app-shell") ? hydrate : mount;

renderApp(App, {
  target,
  props: { initialPath: window.location.pathname },
});
