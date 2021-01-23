import { createVnode } from "./vnode";

export function createAppApi(render) {
  return (component) => {
    let app = {
      mount(container) {
        const vnode = createVnode(component);
        render(vnode, container);
      },
    };
    return app;
  };
}
