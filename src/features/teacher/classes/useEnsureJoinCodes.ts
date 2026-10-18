import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "@robolab/backend/convex/_generated/api";

/**
 * Las clases creadas antes de los códigos no tienen uno y las consultas no
 * pueden escribir: cuando la pantalla ve una sin código, pide al servidor que
 * se lo asigne (una sola vez por pantalla). El código llega solo por la
 * consulta en vivo.
 */
export function useEnsureJoinCodes(someMissing: boolean) {
  const ensure = useMutation(api.classrooms.ensureJoinCodes);
  const asked = useRef(false);
  useEffect(() => {
    if (!someMissing || asked.current) return;
    asked.current = true;
    ensure({}).catch((error: unknown) => console.warn("No se pudo asignar el código de la clase", error));
  }, [someMissing, ensure]);
}
