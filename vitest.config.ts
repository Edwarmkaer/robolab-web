import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "web",
          include: ["src/**/*.test.ts"],
          environment: "node",
          // El paquete del backend trae TypeScript sin compilar: Vite lo transforma al vuelo.
          server: { deps: { inline: ["@robolab/backend"] } },
        },
      },
    ],
  },
});
