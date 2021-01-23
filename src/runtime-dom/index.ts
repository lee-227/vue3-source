import { createRenderer } from "../runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
function ensureRenderer() {
  return createRenderer({ ...nodeOps, patchProp });
}
export function createApp(rootComponent) {
  const app = ensureRenderer().createApp(rootComponent);
  const { mount } = app;
  app.mount = function (container) {
    container = document.querySelector(container);
    container.innerHTML = "";
    mount(container);
  };
  return app;
}
