import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/nunito";
// Los tokens y la base van primero: así el CSS de cada área puede ajustarlos sin pelear por el orden.
import "./shared/ui/styles.css";
import "./shared/ui/safeArea.css";
import { App } from "./app/App";
import { ToastProvider } from "./shared/ui/Toast";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
if (!url) throw new Error("Falta VITE_CONVEX_URL. Corre `npx convex dev` para configurarla.");

const convex = new ConvexReactClient(url);
const root = document.getElementById("root");
if (!root) throw new Error("No se encontró #root.");

createRoot(root).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>,
);
