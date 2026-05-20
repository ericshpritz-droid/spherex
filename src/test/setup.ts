import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// jsdom doesn't implement pointer capture / matchMedia / ResizeObserver.
if (typeof window !== "undefined") {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.hasPointerCapture ??= () => false;

  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
}

// Capacitor haptics imports native bridges — stub.
vi.mock("@/mutual/native/haptics", () => ({
  haptics: { light: vi.fn(), medium: vi.fn(), heavy: vi.fn() },
}));
