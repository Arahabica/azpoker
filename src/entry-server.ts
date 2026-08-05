import { render } from "svelte/server";

import App from "./App.svelte";
import { normalizeAppPath } from "./app-route.ts";

export function renderApp(pathname = "/") {
  return render(App, {
    props: { initialPath: normalizeAppPath(pathname) },
  });
}
