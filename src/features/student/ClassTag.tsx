import { useQuery } from "convex/react";
import { api } from "@robolab/backend/convex/_generated/api";
import { ErrorBoundary } from "../../shared/ui/ErrorBoundary";
import { Icon } from "../../shared/ui/Icon";
import { useStudentToken } from "./session";
import "./join.css";

function Tag({ token }: { token: string }) {
  const home = useQuery(api.student.home, { token });
  if (!home) return null;
  return (
    <span className="class-tag">
      <Icon name="users" size={16} /> {home.displayName}
      {home.joinCode && ` · Clase ${home.joinCode}`}
    </span>
  );
}

/**
 * "Pingüino veloz · Clase TEC-482" cuando el alumno se unió a una clase.
 * Si la sesión venció, no se muestra nada: la página sigue funcionando sin clase.
 */
export function ClassTag() {
  const [token] = useStudentToken();
  if (!token) return null;
  return (
    <ErrorBoundary fallback={() => null}>
      <Tag token={token} />
    </ErrorBoundary>
  );
}
