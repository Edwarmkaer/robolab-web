# Retos en vivo Implementation Plan

> **For agentic workers:** use subagent-driven-development for the backend task and review; the coordinator implements and integrates the frontend in this session.

**Goal:** Probar carreras y colaboración en un laberinto con varios alumnos y seguimiento del docente.
**Architecture:** Reglas puras en domain/live; nuevas tablas y funciones liveRooms en Convex; nuevas pantallas en features/live con entradas desde docente y alumno. Contrato aditivo y dos PRs dependientes.
**Tech Stack:** Convex, TypeScript, React 19, Vitest y convex-test.
**Spec:** docs/superpowers/specs/2026-10-18-retos-en-vivo-design.md

## Global Constraints
- Sesiones actuales, permisos por clase, autoridad del servidor y movimientos limitados a 60.
- Dos modos: race y cooperative; fases waiting, running y closed.
- No revelar programas rivales; ediciones compartidas con revisión.
- Español, estilo Bee-Bot, imports permitidos de @robolab/backend y lockfile git+https.
- npm run verify antes de cada commit. No tocar main, secretos ni wifiLink.ts.

## Review Focus
- Reenvíos y empates: no duplican llegadas ni cambian el primer resultado.
- Cambio de clase, token vencido y docente ajeno: no permiten consultar ni modificar salas.
- Pestaña desactualizada: no borra cambios colaborativos confirmados.
- Cierre o solución mientras llega una ejecución: no acepta progreso posterior.
- Reingreso y cambios reactivos: mantienen el programa confirmado y muestran la fase actual.

### Task 1: Backend y dominio
- [x] Escribir pruebas fallidas de carrera/colaboración, validación y permisos.
- [x] Implementar mapas, reglas, tablas indexadas, funciones con validators y limpieza al eliminar clase.
- [x] Regenerar API con Convex; ejecutar npm run verify y commit en español.
Produces: domain/live/maze y api.liveRooms; contrato exacto acordado entre coordinador e implementador.

### Task 2: Frontend
- [x] Escribir pruebas fallidas de sala de espera, resultados confirmados, colaboración y errores.
- [x] Implementar crear/listar salas, panel docente, acceso alumno, editor y tablero compartido/individual.
- [x] Consumir el commit del backend vía git+https, verificar y revisar.

### Task 3: Integración
- [x] Probar dos clientes en servidor real y pantallas de escritorio/móvil.
- [x] Revisar cambios, corregir hallazgos y correr verify antes de commits finales.
- [x] Actualizar ramas con main si cambió; publicar y adjuntar dos PRs vinculados, comprobar CI y mergeable.
