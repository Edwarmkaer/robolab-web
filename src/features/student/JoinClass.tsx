import { useMutation } from "convex/react";
import { type FormEvent, useState } from "react";
import { api } from "@robolab/backend/convex/_generated/api";
import { userMessage } from "../../shared/errors";
import { usePageTitle } from "../../shared/usePageTitle";
import { ExploreLayout } from "../explore/ExploreLayout";
import "./join.css";

const CODE_MAX = 12; // "ABC-123"; el servidor tolera espacios y guion de más
const NICKNAME_MAX = 24;

/** "Únete a tu clase": código de la clase + apodo. Sin cuenta ni contraseña. */
export function JoinClass({ onJoined }: { onJoined: (token: string) => void }) {
  usePageTitle("Únete a tu clase");
  const join = useMutation(api.student.join);
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // El servidor devuelve el error (no lo lanza) para poder contar los intentos fallidos.
      const result = await join({ code, nickname });
      if ("error" in result) {
        setError(result.error);
        setBusy(false);
        return;
      }
      onJoined(result.token);
    } catch (e) {
      setError(userMessage(e));
      setBusy(false);
    }
  }

  const ready = code.trim().length > 0 && nickname.trim().length > 0;

  return (
    <ExploreLayout>
      <form className="card stack join-card" onSubmit={onSubmit} aria-labelledby="join-title">
        <h1 id="join-title" style={{ margin: 0 }}>
          Únete a tu clase
        </h1>
        <div className="field">
          <label htmlFor="join-code">Código de la clase</label>
          <input
            id="join-code"
            className="input join-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, CODE_MAX))}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="TEC-482"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "join-error" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="join-nickname">Tu apodo</label>
          <input
            id="join-nickname"
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, NICKNAME_MAX))}
            autoComplete="nickname"
            placeholder="Pingüino veloz"
            maxLength={NICKNAME_MAX}
            aria-describedby={error ? "join-error" : "join-hint"}
          />
        </div>
        {error && (
          <p id="join-error" className="alert alert-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={!ready || busy} aria-busy={busy} style={{ justifySelf: "start" }}>
          {busy ? "Entrando…" : "Unirme"}
        </button>
        <p id="join-hint" className="small muted">
          No necesitas cuenta. Tu docente verá tu apodo y tu avance en esta clase.
        </p>
      </form>
    </ExploreLayout>
  );
}
