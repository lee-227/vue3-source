import { isArray } from "../shared";

export const effect = (fn, opt: any = {}) => {
  const effect = createReactiveEffect(fn, opt);
  if (!opt.lazy) {
    effect();
  }
  return effect;
};
export let effectStack = [];
export let activeEffect = null;
function createReactiveEffect(fn, opt) {
  const effect = () => {
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.opt = opt;
  return effect;
}
const targetMap = new WeakMap();
export function track(target, key) {
  if (activeEffect === undefined) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
}
const run = (effects) => {
  if (effects)
    effects.forEach((effect) => {
      if (effect.opt.scheduler) {
        effect.opt.scheduler(effect);
      } else {
        effect();
      }
    });
};
export function trigger(target, type, key, value?) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === "length" || key >= value) {
        run(dep);
      }
    });
  } else {
    if (key !== undefined) {
      let effects = depsMap.get(key);
      run(effects);
    }
    switch (type) {
      case "add":
        if (isArray(target)) {
          if (parseInt(key) == key) {
            run(depsMap.get("length"));
          }
        }
        break;
    }
  }
}
