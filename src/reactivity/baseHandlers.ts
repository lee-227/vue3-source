import { isObject } from "../shared";
import { reactive } from "./reactive";
import { isArray, hasOwn, hasChange } from "../shared/index";
import { track, trigger } from "./effect";

export const mutableHandlers = {
  get(target, key, receiver) {
    let res = Reflect.get(target, key, receiver);
    if (typeof key == "symbol") {
      return res;
    }
    track(target, key);
    if (res && res.__v_isRef) {
      return res.value;
    }
    return isObject(res) ? reactive(res) : res;
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    const hadKey =
      isArray(target) && parseInt(key, 10) == key
        ? Number(key) < target.length
        : hasOwn(target, key);
    let result = Reflect.set(target, key, value, receiver);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChange(value, oldValue)) {
      trigger(target, "set", key, value);
    }
    return result;
  },
};
