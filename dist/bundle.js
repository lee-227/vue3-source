(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.VueReactivity = {}));
}(this, (function (exports) { 'use strict';

  var isObject = function (val) {
      return typeof val == "object" && val !== null;
  };
  var isArray = function (target) { return Array.isArray(target); };
  var hasChange = function (oldVal, newVal) { return oldVal !== newVal; };
  var hasOwn = function (target, key) {
      return Object.prototype.hasOwnProperty.call(target, key);
  };
  var isFunction = function (val) { return typeof val == "function"; };
  var isString = function (val) { return typeof val == 'string'; };

  var effect = function (fn, opt) {
      if (opt === void 0) { opt = {}; }
      var effect = createReactiveEffect(fn, opt);
      if (!opt.lazy) {
          effect();
      }
      return effect;
  };
  var effectStack = [];
  var activeEffect = null;
  function createReactiveEffect(fn, opt) {
      var effect = function () {
          if (!effectStack.includes(effect)) {
              try {
                  effectStack.push(effect);
                  activeEffect = effect;
                  return fn();
              }
              finally {
                  effectStack.pop();
                  activeEffect = effectStack[effectStack.length - 1];
              }
          }
      };
      effect.opt = opt;
      return effect;
  }
  var targetMap = new WeakMap();
  function track(target, key) {
      if (activeEffect === undefined)
          return;
      var depsMap = targetMap.get(target);
      if (!depsMap) {
          targetMap.set(target, (depsMap = new Map()));
      }
      var dep = depsMap.get(key);
      if (!dep) {
          depsMap.set(key, (dep = new Set()));
      }
      if (!dep.has(activeEffect)) {
          dep.add(activeEffect);
      }
  }
  var run = function (effects) {
      if (effects)
          effects.forEach(function (effect) {
              if (effect.opt.scheduler) {
                  effect.opt.scheduler(effect);
              }
              else {
                  effect();
              }
          });
  };
  function trigger(target, type, key, value) {
      var depsMap = targetMap.get(target);
      if (!depsMap)
          return;
      if (key === "length" && isArray(target)) {
          depsMap.forEach(function (dep, key) {
              if (key === "length" || key >= value) {
                  run(dep);
              }
          });
      }
      else {
          if (key !== undefined) {
              var effects = depsMap.get(key);
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

  var mutableHandlers = {
      get: function (target, key, receiver) {
          var res = Reflect.get(target, key, receiver);
          if (typeof key == "symbol") {
              return res;
          }
          track(target, key);
          if (res && res.__v_isRef) {
              return res.value;
          }
          return isObject(res) ? reactive(res) : res;
      },
      set: function (target, key, value, receiver) {
          var oldValue = target[key];
          var hadKey = isArray(target) && parseInt(key, 10) == key
              ? Number(key) < target.length
              : hasOwn(target, key);
          var result = Reflect.set(target, key, value, receiver);
          if (!hadKey) {
              trigger(target, "add", key, value);
          }
          else if (hasChange(value, oldValue)) {
              trigger(target, "set", key, value);
          }
          return result;
      },
  };

  var reactive = function (target) {
      return createReactiveObject(target, mutableHandlers);
  };
  var reactiveMap = new WeakMap();
  function createReactiveObject(target, baseHandler) {
      if (!isObject(target))
          return target;
      var existProxy = reactiveMap.get(target);
      if (existProxy)
          return existProxy;
      var proxy = new Proxy(target, baseHandler);
      reactiveMap.set(target, proxy);
      return proxy;
  }

  var ref = function (rawValue) {
      return new RefImpl(rawValue);
  };
  var convert = function (val) { return (isObject(val) ? reactive(val) : val); };
  var RefImpl = /** @class */ (function () {
      function RefImpl(rawValue) {
          this.rawValue = rawValue;
          this.__v_isRef = true;
          this._rawValue = rawValue;
          this._value = convert(rawValue);
      }
      Object.defineProperty(RefImpl.prototype, "value", {
          get: function () {
              track(this, "value");
              return this._value;
          },
          set: function (newValue) {
              if (hasChange(newValue, this._rawValue)) {
                  this._rawValue = newValue;
                  this._value = convert(newValue);
                  trigger(this, "set", "value");
              }
          },
          enumerable: false,
          configurable: true
      });
      return RefImpl;
  }());
  var toRefs = function (object) {
      var result = isArray(object) ? new Array(object.length) : {};
      for (var key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
              result[key] = new ObjectRefImpl(object, key);
          }
      }
      return result;
  };
  var ObjectRefImpl = /** @class */ (function () {
      function ObjectRefImpl(object, key) {
          this.object = object;
          this.key = key;
      }
      Object.defineProperty(ObjectRefImpl.prototype, "value", {
          get: function () {
              return this.object[this.key];
          },
          set: function (newVal) {
              this.object[this.key] = newVal;
          },
          enumerable: false,
          configurable: true
      });
      return ObjectRefImpl;
  }());

  var computed = function (getterOrOptions) {
      var getter;
      var setter;
      if (isFunction(getterOrOptions)) {
          getter = getterOrOptions;
          setter = function () {
              console.log("computed  not set value");
          };
      }
      else {
          getter = getterOrOptions.get;
          setter = getterOrOptions.set;
      }
      return new ComputedRefImpl(getter, setter);
  };
  var ComputedRefImpl = /** @class */ (function () {
      function ComputedRefImpl(getter, setter) {
          var _this = this;
          this.__v_isReadonly = true;
          this.__v_isRef = true;
          this._dirty = true;
          this.setter = setter;
          this.effect = effect(getter, {
              lazy: true,
              scheduler: function () {
                  _this._dirty = true;
                  trigger(_this, "set", "value");
              },
          });
      }
      Object.defineProperty(ComputedRefImpl.prototype, "value", {
          get: function () {
              if (this._dirty) {
                  this._dirty = false;
                  this._value = this.effect();
                  track(this, "value");
                  return this._value;
              }
              return this._value;
          },
          set: function (newVal) {
              this.setter(newVal);
          },
          enumerable: false,
          configurable: true
      });
      return ComputedRefImpl;
  }());

  function createVnode(type, props, children) {
      if (props === void 0) { props = {}; }
      if (children === void 0) { children = null; }
      var shapeFlag = isString(type)
          ? 1 /* ELEMENT */
          : isObject(type)
              ? 4 /* STATEFUL_COMPONENT */
              : 0;
      var vnode = {
          type: type,
          props: props,
          children: children,
          component: null,
          el: null,
          key: props.key,
          shapeFlag: shapeFlag,
      };
      if (isArray(children)) {
          vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
      }
      else {
          vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
      }
      return vnode;
  }

  function createAppApi(render) {
      return function (component) {
          var app = {
              mount: function (container) {
                  var vnode = createVnode(component);
                  render(vnode, container);
              },
          };
          return app;
      };
  }

  function createComponentInstance(vnode) {
      var instance = {
          type: vnode.type,
          props: {},
          subTree: null,
          vnode: vnode,
          render: null,
          setupState: null,
          isMounted: false,
      };
      return instance;
  }
  function setupComponent(instance) {
      setupStatefulComponent(instance);
  }
  function setupStatefulComponent(instance) {
      var Component = instance.type;
      var setup = Component.setup;
      if (setup) {
          var setupResult = setup(instance.props);
          handleSetupResult(instance, setupResult);
      }
  }
  function handleSetupResult(instance, setupResult) {
      if (isFunction(setupResult)) {
          instance.render = setupResult;
      }
      else {
          instance.setupState = setupResult;
      }
      finishComponentSetup(instance);
  }
  function finishComponentSetup(instance) {
      var Component = instance.type;
      if (Component.render && !instance.render) {
          instance.render = Component.render;
      }
      else if (!instance.render) ;
  }

  function createRenderer(options) {
      var hostCreateElement = options.createElement, hostInsert = options.insert; options.remove; var hostSetElementText = options.setElementText; options.createTextNode; var hostPatchProp = options.patchProp;
      var render = function (vnode, container) {
          patch(null, vnode, container);
      };
      var patch = function (n1, n2, container, anchor) {
          if (anchor === void 0) { anchor = null; }
          var shapeFlag = n2.shapeFlag;
          if (shapeFlag & 1 /* ELEMENT */) {
              processElement(n1, n2, container, anchor);
          }
          else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
              processComponent(n1, n2, container);
          }
      };
      var processElement = function (n1, n2, container, anchor) {
          if (n1 == null) {
              // 组件挂载
              mountElement(n2, container, anchor);
          }
      };
      var processComponent = function (n1, n2, container) {
          if (n1 == null) {
              mountComponent(n2, container);
          }
      };
      var mountElement = function (vnode, container, anchor) {
          var type = vnode.type, shapeFlag = vnode.shapeFlag, props = vnode.props, children = vnode.children;
          var el = (vnode.el = hostCreateElement(type));
          if (shapeFlag & 8 /* TEXT_CHILDREN */) {
              hostSetElementText(el, children);
          }
          else {
              mountChildren(children, el);
          }
          if (props) {
              for (var key in props) {
                  hostPatchProp(el, key, null, props[key]);
              }
          }
          hostInsert(el, container, anchor);
      };
      function mountChildren(children, container) {
          for (var i = 0; i < children.length; i++) {
              patch(null, children[i], container);
          }
      }
      var mountComponent = function (vnode, container) {
          var instance = (vnode.component = createComponentInstance(vnode));
          setupComponent(instance);
          setupRenderEffect(instance, container);
      };
      function setupRenderEffect(instance, container) {
          effect(function () {
              if (!instance.isMounted) {
                  var subTree = (instance.subTree = instance.render());
                  patch(null, subTree, container);
              }
          });
      }
      return {
          createApp: createAppApi(render),
      };
  }

  function h(type, props, children) {
      return createVnode(type, props, children);
  }

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  var nodeOps = {
      createElement: function (type) {
          return document.createElement(type);
      },
      insert: function (child, parent, anchor) {
          if (anchor === void 0) { anchor = null; }
          parent.insertBefore(child, anchor);
      },
      remove: function (child) {
          var parent = child.parentNode;
          if (parent) {
              parent.removeChild(child);
          }
      },
      setElementText: function (el, content) {
          el.textContent = content;
      },
      createTextNode: function (content) {
          return document.createTextNode(content);
      },
  };

  function patchProp(el, key, prevValue, nextValue) {
      switch (key) {
          case "style":
              patchStyle(el, prevValue, nextValue);
              break;
          case "className":
              patchClass(el, nextValue);
              break;
          default:
              patchAttr(el, key, nextValue);
              break;
      }
  }
  function patchStyle(el, prev, next) {
      var style = el.style;
      if (!next) {
          el.removeAttribute("style");
      }
      else {
          for (var key in next) {
              if (Object.prototype.hasOwnProperty.call(next, key)) {
                  style[key] = next[key];
              }
          }
          if (prev) {
              for (var key in prev) {
                  if (Object.prototype.hasOwnProperty.call(prev, key)) {
                      if (!next[key]) {
                          style[key] = "";
                      }
                  }
              }
          }
      }
  }
  function patchClass(el, next) {
      if (next == null) {
          next = "";
      }
      el.className = next;
  }
  function patchAttr(el, key, value) {
      if (!value) {
          el.removeAttribute(key);
      }
      else {
          el.setAttribute(key, value);
      }
  }

  function ensureRenderer() {
      return createRenderer(__assign(__assign({}, nodeOps), { patchProp: patchProp }));
  }
  function createApp(rootComponent) {
      var app = ensureRenderer().createApp(rootComponent);
      var mount = app.mount;
      app.mount = function (container) {
          container = document.querySelector(container);
          container.innerHTML = "";
          mount(container);
      };
      return app;
  }

  exports.computed = computed;
  exports.createApp = createApp;
  exports.createRenderer = createRenderer;
  exports.effect = effect;
  exports.h = h;
  exports.reactive = reactive;
  exports.ref = ref;
  exports.toRefs = toRefs;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=bundle.js.map
