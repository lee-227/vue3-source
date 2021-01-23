export const enum ShapeFlags {
  ELEMENT = 1, //  普通元素
  FUNCTIONAL_COMPONENT = 1 << 1, // 函数组件   位移  10  
  STATEFUL_COMPONENT = 1 << 2, // 带状态组件    //  100
  TEXT_CHILDREN = 1 << 3, // 文本孩子          //  1000 
  ARRAY_CHILDREN = 1 << 4, // 数组孩子       //   10000
}

