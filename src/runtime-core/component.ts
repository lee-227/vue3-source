import { isFunction } from '../shared'

export function createComponentInstance(vnode) {
  const instance = {
    type: vnode.type,
    props: {},
    subTree: null,
    vnode,
    render: null,
    setupState: null,
    isMounted: false,
  }
  return instance
}
export function setupComponent(instance) {
  setupStatefulComponent(instance)
}
function setupStatefulComponent(instance) {
  const Component = instance.type
  let { setup } = Component
  if (setup) {
    const setupResult = setup(instance.props)
    handleSetupResult(instance, setupResult)
  }
}
function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}
function finishComponentSetup(instance) {
  const Component = instance.type
  if (Component.render && !instance.render) {
    instance.render = Component.render
  } else if (!instance.render) {
  }
  applyOptions(instance)
}
function applyOptions(instance) {}
