import { ShapeFlags } from "../shared";
import { createAppApi } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { effect } from "../reactivity";

export function createRenderer(options) {
  let {
    createElement: hostCreateElement,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createTextNode: hostCreateNode,
    patchProp: hostPatchProp,
  } = options;

  const render = function (vnode, container) {
    patch(null, vnode, container);
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 && !isSameVnodeType(n1, n2)) {
      hostRemove(n1.el);
      n1 = null;
    }
    let { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(n1, n2, container);
    }
  };
  const isSameVnodeType = (n1, n2) => {
    return n1.type == n2.type && n1.key == n2.key;
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 组件挂载
      mountElement(n2, container, anchor);
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
  const mountElement = (vnode, container, anchor) => {
    let { type, shapeFlag, props, children } = vnode;
    let el = (vnode.el = hostCreateElement(type));
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else {
      mountChildren(children, el);
    }
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    hostInsert(el, container, anchor);
  };
  function mountChildren(children, container) {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  }
  const patchElement = (n1, n2, container) => {
    let el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const nextProps = n2.props || {};
    patchProps(oldProps, nextProps, el);
    patchChildren(n1, n2, el);
  };
  function patchChildren(n1, n2, el) {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const nextShapeFlag = n2.shapeFlag;
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (c2 !== c1) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        patchKeyedChildren(c1, c2, el);
      } else {
        hostSetElementText(el, "");
        mountChildren(c2, el);
      }
    }
  }
  function patchKeyedChildren(c1, c2, el) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      
    }
  }
  function patchProps(oldProps, newProps, el) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }
  const mountComponent = (vnode, container) => {
    const instance = (vnode.component = createComponentInstance(vnode));

    setupComponent(instance);

    setupRenderEffect(instance, container);
  };
  function setupRenderEffect(instance, container) {
    effect(() => {
      if (!instance.isMounted) {
        let subTree = (instance.subTree = instance.render());
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        let prevTree = instance.subTree;
        let nextTree = (instance.subTree = instance.render());
        patch(prevTree, nextTree, container);
      }
    });
  }
  const updateComponent = (n1, n2, container) => {};

  return {
    createApp: createAppApi(render),
  };
}
