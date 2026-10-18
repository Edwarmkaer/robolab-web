# Retos en vivo

El docente abre un laberinto para su clase y los alumnos entran con su sesión de código y apodo. Se ofrecen dos modos: carrera, con tablero individual y orden de llegada decidido por el servidor, y colaborativo, con programa y tablero compartidos. El usuario pidió implementación y PRs en ambos repositorios; se ejecutará el trabajo y su revisión en esta sesión.

Flujo: crear sala → alumnos se unen a la sala de espera → docente inicia → ejecutar programas y recibir resultados reactivos → docente finaliza. Quien se desconecta conserva el progreso confirmado y puede volver. No se admiten nuevos participantes después del inicio. El ganador no cierra automáticamente la carrera: los demás pueden terminar.

Convex mantiene la autoridad del inicio, cierre, simulación y llegada. Se reutilizan las sesiones existentes y las guardias de docente/alumno; ningún alumno accede a otra clase. Los programas rivales no se exponen. En colaborativo las ediciones llevan revisión para impedir sobrescrituras silenciosas. Las ejecuciones y ediciones se rechazan antes del inicio o después del cierre/solución. Los resultados y las listas se reciben por useQuery, sin sondeos.

Laberintos pequeños fijos y comprobados como resolubles, comandos de avanzar, retroceder y girar, límite de 60 movimientos y 100 participantes. No hay transmisión de video, servicio adicional, presencia en línea ni animación remota en esta primera versión. La interfaz distingue participantes de conexiones activas. Respeta Bee-Bot y usa textos en español, etiquetas accesibles, título y foco al cambiar de fase.

Validación: pruebas de reglas puras y convex-test para permisos, empate/orden, ejecuciones duplicadas, cierre, reingreso y revisiones concurrentes; pruebas de pantalla para espera, errores, éxito confirmado y cambios reactivos. Verificación completa en ambos repositorios y prueba con dos clientes de la conexión real. PRs contra main actual con comprobación de conflictos; el frontend fija el commit del backend del PR por git+https y documenta el orden de integración.
