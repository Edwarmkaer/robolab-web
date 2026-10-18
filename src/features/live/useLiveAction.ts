import { useRef, useState } from "react";
import { userMessage } from "../../shared/errors";

/** Evita repetir una acción mientras espera al servidor y muestra errores legibles. */
export function useLiveAction() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function perform(action: () => Promise<unknown>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(userMessage(err, "No pudimos guardar el cambio. Intenta de nuevo."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { busy, error, perform };
}
