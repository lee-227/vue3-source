import { isArray, isObject, isString, ShapeFlags } from "../shared";
export function createVnode(type, props: any = {}, children = null) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;
  let vnode = {
    type,
    props,
    children,
    component: null,
    el: null,
    key: props.key,
    shapeFlag,
  };
  if (isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }
  return vnode;
}
