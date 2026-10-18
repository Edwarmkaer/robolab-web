# Guía para agentes y colaboradores

Web de RoboLab: retos de programación con un robot (modo abierto, sin cuenta) y
evaluaciones que se juegan (docente + alumnos con código). Vite + React 19 +
TypeScript. El backend (Convex) y el dominio compartido están en otro repo,
[robolab-backend](https://github.com/orinqq/robolab-backend), y llegan como el
paquete `@robolab/backend`. El README explica el producto; aquí van las reglas
para trabajar en el código.

## Comandos

```bash
npm ci                 # instalar (usa el lockfile; trae el backend desde GitHub por https)
npm run dev            # web en http://localhost:5173 (necesita VITE_CONVEX_URL en .env.local)
npm run verify         # tipos + lint + pruebas + build: debe pasar antes de cada commit
npm install git+https://github.com/orinqq/robolab-backend.git#main   # traer el backend nuevo
```

Para que la web funcione hace falta un backend corriendo: seguir el README de
robolab-backend (`npx convex dev`, `npm run setup`) y copiar su `CONVEX_URL` en
el `.env.local` de aquí como `VITE_CONVEX_URL`.

## Arquitectura (respétala)

- Las reglas de negocio (juego, calificación, códigos, validaciones) **no van
  aquí**: se importan de `@robolab/backend/domain/<ruta>`. Si falta una regla,
  se agrega en el repo del backend con su prueba y luego se actualiza el paquete.
- Las funciones del backend se llaman con `api` de
  `@robolab/backend/convex/_generated/api`; los tipos `Id<"tabla">` vienen de
  `@robolab/backend/convex/_generated/dataModel` (solo `import type`).
- Solo esas tres rutas del paquete existen (campo `exports`): no importes otros
  archivos del backend por ruta.
- El servidor es la autoridad: la web muestra, el backend simula, cuenta y
  califica. Nunca asumas en pantalla algo que el servidor no confirmó.
- Al alumno nunca se le muestra la respuesta correcta antes de responder.
- Pantallas en `src/features/<área>/`; componentes y estilos comunes en
  `src/shared/ui/` (tokens de color en `styles.css`, íconos en `Icon.tsx`).
- `src/features/robot/wifiLink.ts` es un solo archivo sin imports, pensado para
  que otra web lo copie tal cual: mantenlo así.

## Cómo trabajar

- Prueba primero: un error se reproduce con una prueba que falla, y esa prueba
  se queda. Las pruebas de aquí son de lógica de pantalla (Vitest en Node); las
  del dominio y del backend viven en robolab-backend.
- Corre `npm run verify` antes de cada commit; GitHub Actions lo vuelve a correr.
- Textos de la interfaz en español neutro, cortos y pensados para niños o
  docentes. Botones con ícono siempre llevan etiqueta accesible.
- Commits pequeños, en español, que expliquen el porqué. Trabaja en una rama y
  abre un pull request; no hagas `push --force` sobre `main`.
- Cuando el backend cambie, actualiza el paquete (`npm install git+https://...#main`)
  y commitea `package-lock.json`: ahí queda fijado el commit del backend con el
  que compila esta web. Si TypeScript marca algo del paquete, cambió el contrato.

## Cuidado con

- Colores: solo los tokens de `src/shared/ui/styles.css` (`var(--c-…)`). Una prueba
  (`tokens.test.ts`) falla si aparece un `#hex` suelto en un CSS o componente, y
  también revisa el contraste de los pares de texto/fondo. `styles.css` se
  importa primero en `main.tsx`: el CSS de cada área puede ajustar sin pelear
  por el orden.
- Pantallas: el título de la pestaña va con `usePageTitle`, cada página tiene un
  `<h1>` y el foco pasa al título cuando cambia de fase (`useFocusOnMount`).
  `aria-label` solo en elementos con rol (`role="img"`, `list`, `group`…).
- `@robolab/backend` se instala desde git con `git+https://`, nunca `github:` ni
  ssh: en Vercel no hay llaves ssh. Comprueba en el lockfile que `resolved`
  empiece con `git+https`.
- Secretos nunca van al repo ni al código del navegador. `VITE_CONVEX_URL` es la
  única variable de la web y no es secreta; no subas `.env.local`.
- En Windows PowerShell 5.1, `Get-Content`/`Set-Content` dañan las tildes al
  editar archivos; usa un editor o herramientas que respeten UTF-8.
