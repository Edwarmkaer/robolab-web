import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "web",
          // Las pruebas de componentes (.test.tsx) piden jsdom con `// @vitest-environment jsdom`.
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "node",
          // El paquete del backend trae TypeScript sin compilar: Vite lo transforma al vuelo.
          server: { deps: { inline: ["@robolab/backend"] } },
        },
      },
    ],
  },
});
