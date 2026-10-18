/** Dónde queda guardado el modelo de gestos en el equipo (cambiar el nombre obliga a bajarlo otra vez). */
export const MODEL_CACHE = "robolab-gestos-v1";

type Deps = { fetch: typeof fetch; caches: CacheStorage | undefined };

const defaults = (): Deps => ({
  fetch: (input, init) => fetch(input, init),
  caches: typeof caches === "undefined" ? undefined : caches,
});

/**
 * Trae el modelo de gestos (~8 MB). La primera vez lo baja y lo guarda en el
 * equipo; las siguientes lo lee de ahí sin internet, aunque la caché normal del
 * navegador ya lo haya soltado (el servidor del modelo solo la permite una hora).
 * Si no se puede guardar (sin espacio, navegador sin caché), igual lo devuelve.
 */
export async function loadModel(url: string, deps: Deps = defaults()): Promise<Uint8Array> {
  const cache = await deps.caches?.open(MODEL_CACHE).catch(() => undefined);
  const saved = await cache?.match(url).catch(() => undefined);
  if (saved) return new Uint8Array(await saved.arrayBuffer());
  const response = await deps.fetch(url);
  if (!response.ok) throw new Error(`No se pudo bajar el modelo de gestos (${response.status}).`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await cache?.put(url, new Response(bytes)).catch(() => undefined);
  return bytes;
}
