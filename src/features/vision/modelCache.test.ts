// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { loadModel } from "./modelCache";

const URL_MODEL = "https://modelos.test/gestos.task";
const BYTES = new Uint8Array([1, 2, 3, 4]);

function fakeCaches(failPut = false) {
  const store = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (url: string) => store.get(url)?.clone()),
    put: vi.fn(async (url: string, response: Response) => {
      if (failPut) throw new DOMException("Sin espacio", "QuotaExceededError");
      store.set(url, response);
    }),
  };
  return { caches: { open: vi.fn(async () => cache) } as unknown as CacheStorage, cache };
}

describe("modelo de gestos guardado en el equipo", () => {
  it("la primera vez lo baja y lo guarda; la siguiente lo lee del equipo sin bajarlo otra vez", async () => {
    const { caches } = fakeCaches();
    const fetch = vi.fn(async () => new Response(BYTES));
    expect(await loadModel(URL_MODEL, { fetch, caches })).toEqual(BYTES);
    expect(await loadModel(URL_MODEL, { fetch, caches })).toEqual(BYTES);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("si el navegador no tiene dónde guardarlo, lo baja igual", async () => {
    const fetch = vi.fn(async () => new Response(BYTES));
    expect(await loadModel(URL_MODEL, { fetch, caches: undefined })).toEqual(BYTES);
  });

  it("si guardar falla (sin espacio), igual devuelve el modelo", async () => {
    const { caches } = fakeCaches(true);
    const fetch = vi.fn(async () => new Response(BYTES));
    expect(await loadModel(URL_MODEL, { fetch, caches })).toEqual(BYTES);
  });

  it("si la descarga falla, avisa con un error y no guarda nada", async () => {
    const { caches, cache } = fakeCaches();
    const fetch = vi.fn(async () => new Response("no", { status: 503 }));
    await expect(loadModel(URL_MODEL, { fetch, caches })).rejects.toThrow(/503/);
    expect(cache.put).not.toHaveBeenCalled();
  });
});
