import "@testing-library/jest-dom/vitest";

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (typeof window !== "undefined" && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId?: number;
    pointerType?: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
    }
  }
  // @ts-expect-error jsdom has no native PointerEvent; Radix UI needs one for pointer interactions
  window.PointerEvent = PointerEventPolyfill;
}
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
