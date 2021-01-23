import { effect, track, trigger } from "./effect";
import { isFunction } from "../shared/index";
export const computed = (getterOrOptions) => {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.log("computed  not set value");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
};

class ComputedRefImpl {
  public effect;
  public __v_isReadonly = true;
  public readonly __v_isRef = true;
  public _dirty = true;
  private _value;
  public setter;
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        this._dirty = true;
        trigger(this, "set", "value");
      },
    });
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect();
      track(this, "value");
      return this._value;
    }
    return this._value;
  }
  set value(newVal) {
    this.setter(newVal);
  }
}
