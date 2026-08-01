import { mount } from "svelte";

import "../styles.css";
import SuitMarkPreview from "./SuitMarkPreview.svelte";

const target = document.querySelector("#app");

if (!target) {
  throw new Error("採用スートページの描画先が見つかりません");
}

mount(SuitMarkPreview, { target });
