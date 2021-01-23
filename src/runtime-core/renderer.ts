import { ShapeFlags } from "../shared";
import { createAppApi } from "./apiCreateApp";
import {
  createComponentInstance,
  setupComponent,
  setupRenderEffect,
} from "./component";

export function createRenderer(options) {
  const render = function (vnode, container) {
    patch(null, vnode, container);
  };
  return {
    createApp: createAppApi(render),
  };
}
const patch = (n1, n2, container) => {
  let { shapeFlag } = n2;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(n1, n2, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(n1, n2, container);
  }
};
const processElement = (n1, n2, container) => {
  if (n1 == null) {
    // 组件挂载
    mountElement(n2, container);
  } else {
    patchElement(n1, n2, container);
  }
};
const processComponent = (n1, n2, container) => {
  if (n1 == null) {
    mountComponent(n2, container);
  } else {
    updateComponent(n1, n2, container);
  }
};
const mountElement = (vnode, container) => {};
const patchElement = (n1, n2, container) => {};
const mountComponent = (vnode, container) => {
  const instance = (vnode.component = createComponentInstance(vnode)); 

  setupComponent(instance);

  setupRenderEffect();
};
const updateComponent = (n1, n2, container) => {};
