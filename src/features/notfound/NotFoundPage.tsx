import { Link } from "react-router-dom";
import { useFocusOnMount } from "../../shared/useFocusOnMount";
import { ExploreLayout } from "../explore/ExploreLayout";

/** Página que no existe: lo dice con claridad y ofrece adónde ir (antes redirigía a la portada sin avisar). */
export function NotFoundPage() {
  const focusTitle = useFocusOnMount<HTMLHeadingElement>();
  return (
    <ExploreLayout title="Página no encontrada" backTo="/">
      <section className="card stack" style={{ textAlign: "center", justifyItems: "center", maxWidth: 520, margin: "0 auto" }}>
        <div className="robot-badge">
          <img src="/robot/robot-error.svg" alt="" />
        </div>
        <h1 tabIndex={-1} ref={focusTitle} style={{ margin: 0 }}>
          No encontramos esta página
        </h1>
        <p className="muted">El enlace puede estar mal escrito o la página ya no existe.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" to="/">
            Volver al inicio
          </Link>
          <Link className="btn" to="/mi-avance">
            Mi avance
          </Link>
        </div>
      </section>
    </ExploreLayout>
  );
}
