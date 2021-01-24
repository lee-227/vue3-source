import { ShapeFlags } from '../shared'
import { createAppApi } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { effect } from '../reactivity'

export function createRenderer(options) {
  let {
    createElement: hostCreateElement,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createTextNode: hostCreateNode,
    patchProp: hostPatchProp,
  } = options

  const render = function (vnode, container) {
    patch(null, vnode, container)
  }
  const patch = (n1, n2, container, anchor = null) => {
    let { shapeFlag } = n2
    if (shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, n2, container, anchor)
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(n1, n2, container)
    }
  }
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 组件挂载
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2, container)
    }
  }
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      mountComponent(n2, container)
    } else {
      updateComponent(n1, n2, container)
    }
  }
  const mountElement = (vnode, container, anchor) => {
    let { type, shapeFlag, props, children } = vnode
    let el = (vnode.el = hostCreateElement(type))
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else {
      mountChildren(children, el)
    }
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    hostInsert(el, container, anchor)
  }
  function mountChildren(children, container) {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container)
    }
  }
  const patchElement = (n1, n2, container) => {}
  const mountComponent = (vnode, container) => {
    const instance = (vnode.component = createComponentInstance(vnode))

    setupComponent(instance)

    setupRenderEffect(instance, container)
  }
  function setupRenderEffect(instance, container) {
    effect(() => {
      if (!instance.isMounted) {
        let subTree = (instance.subTree = instance.render())
        patch(null, subTree, container)
      } else {
      }
    })
  }
  const updateComponent = (n1, n2, container) => {}

  return {
    createApp: createAppApi(render),
  }
}
