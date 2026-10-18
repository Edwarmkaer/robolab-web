/** "4:12": minutos y segundos, como un cronómetro. Para tablas donde "4 min 12 s" no cabe. */
export function clock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "2,0" o "0,8": promedios con un decimal y coma decimal, como en la escuela (y en la maqueta). */
export const decimal = (value: number): string => (Number.isFinite(value) ? value : 0).toFixed(1).replace(".", ",");

/** Copia al portapapeles; devuelve false donde no se puede (http sin https, permisos). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
