export function patchProp(el, key, prevValue, nextValue) {
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
  const style = el.style;
  if (!next) {
    el.removeAttribute("style");
  } else {
    for (const key in next) {
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        style[key] = next[key];
      }
    }
    if (prev) {
      for (const key in prev) {
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
  } else {
    el.setAttribute(key, value);
  }
}
