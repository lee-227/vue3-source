export function createComponentInstance(vnode) {
  const instance = {
    type: vnode.type,
    props: {},
    subTree: null,
    vnode,
    render: null,
    setupState: null,
    isMounted: false,
  };
  return instance;
}
export function setupComponent(instance) {
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
  const Component = instance.type;
  let { setup } = Component;
  if (setup) {
    const setupResult = setup(instance.props);
    console.log(setupResult);
  }
}
export function setupRenderEffect(){
  
}
