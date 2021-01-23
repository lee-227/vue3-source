import { reactive } from "./reactive";
import { hasChange, isArray, isObject } from "../shared";
import { track, trigger } from "./effect";

export const ref = (rawValue) => {
  return new RefImpl(rawValue);
};
const convert = (val) => (isObject(val) ? reactive(val) : val);
class RefImpl {
  public _rawValue;
  public readonly __v_isRef = true;
  public _value;
  constructor(public rawValue) {
    this._rawValue = rawValue;
    this._value = convert(rawValue);
  }
  get value() {
    track(this, "value");
    return this._value;
  }
  set value(newValue) {
    if (hasChange(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      trigger(this, "set", "value");
    }
  }
}

export const toRefs = (object) => {
  const result = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = new ObjectRefImpl(object, key);
    }
  }
  return result;
};
class ObjectRefImpl {
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key];
  }
  set value(newVal) {
    this.object[this.key] = newVal;
  }
}
