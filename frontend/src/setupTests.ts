import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill Path2D for jsdom test environment
if (typeof globalThis.Path2D === 'undefined') {
  class MockPath2D {
    moveTo = vi.fn();
    lineTo = vi.fn();
    closePath = vi.fn();
    arc = vi.fn();
    bezierCurveTo = vi.fn();
    quadraticCurveTo = vi.fn();
    rect = vi.fn();
  }
  globalThis.Path2D = MockPath2D as unknown as typeof Path2D;
}

// Polyfill ResizeObserver for jsdom test environment
if (typeof globalThis.ResizeObserver === 'undefined') {
  class MockResizeObserver {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  globalThis.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
}

// Mock Canvas 2D context in jsdom, preserving instance per canvas
const contextCache = new WeakMap<HTMLCanvasElement, unknown>();

HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (
  this: HTMLCanvasElement,
  contextId: string
) {
  if (contextId === '2d') {
    if (!contextCache.has(this)) {
      contextCache.set(this, {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 20 }),
        canvas: this,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: 'center',
        textBaseline: 'middle',
      });
    }
    return contextCache.get(this);
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
