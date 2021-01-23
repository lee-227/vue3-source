export const isObject = (val: unknown): val is Object =>
  typeof val == "object" && val !== null;
export const isArray = (target) => Array.isArray(target);
export const hasChange = (oldVal, newVal) => oldVal !== newVal;
export const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);
export const isFunction = (val) => typeof val == "function";
export const isString = (val) => typeof val == 'string'
export * from "./ShapeFlags";
