// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { MODEL_URL, WASM_BASE, prefetchGestureAssets } from "./gestureAssets";

afterEach(() => {
  document.head.innerHTML = "";
  vi.unstubAllGlobals();
});

const links = () => [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="prefetch"]')].map((l) => l.href);

describe("precarga de los gestos", () => {
  it("pide el motor y el modelo para que ya estén en la caché al encender la cámara", () => {
    prefetchGestureAssets();
    expect(links()).toEqual([`${WASM_BASE}/vision_wasm_internal.js`, `${WASM_BASE}/vision_wasm_internal.wasm`, MODEL_URL]);
    expect(document.head.querySelector<HTMLLinkElement>("link[rel=prefetch]")!.crossOrigin).toBe("anonymous");
  });

  it("no repite el pedido si se llama otra vez", () => {
    prefetchGestureAssets();
    prefetchGestureAssets();
    expect(links()).toHaveLength(3);
  });

  it("respeta el ahorro de datos", () => {
    vi.stubGlobal("navigator", { ...navigator, connection: { saveData: true } });
    prefetchGestureAssets();
    expect(links()).toEqual([]);
  });
});
