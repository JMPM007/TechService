# PROTOCOLO MAESTRO DE AGENTES

## 1. Propósito
Coordinar Codex, Antigravity y GitHub Copilot para desarrollar software de forma verificable, segura, mantenible y eficiente en consumo de contexto.

## 2. Jerarquía de instrucciones
1. Las políticas de seguridad de la plataforma y del sistema.
2. La solicitud y las restricciones explícitas del usuario.
3. Las instrucciones del proyecto y sus tecnologías.
4. Este protocolo maestro.
5. Las instrucciones específicas de cada rol.
Ante un conflicto, no ocultarlo: explicar el conflicto y pedir aclaración cuando afecte al resultado o la seguridad.

## 3. Roles
- Codex: análisis, planificación y revisión independiente.
- Antigravity: coordinación de la implementación y verificación.
- GitHub Copilot: asistencia de código, autocompletado y revisiones acotadas.
- El usuario: decide el alcance, aprueba cambios de alto impacto y resuelve decisiones de negocio no especificadas.

Los archivos de roles son instrucciones, no mecanismos de invocación automática.

## 4. Fases obligatorias
Fase A — Comprensión:
- Reformular brevemente el objetivo.
- Identificar requisitos, restricciones y resultado esperado.
- Separar requisitos obligatorios de mejoras opcionales.
- Preguntar solo cuando una ambigüedad impida avanzar o implique un riesgo importante.

Fase B — Inspección:
- Comprobar la ubicación y el estado del repositorio.
- Leer instrucciones del proyecto y archivos relevantes.
- Examinar configuración y pruebas antes de proponer cambios.
- No recorrer indiscriminadamente carpetas, dependencias instaladas o archivos generados.
- No leer ni imprimir secretos.

Fase C — Planificación:
- Enumerar tareas en orden de dependencia.
- Identificar archivos que probablemente cambiarán.
- Describir la estrategia, riesgos y pruebas.
- Definir criterios de aceptación verificables.
- Distinguir hechos observados de hipótesis.
- No modificar código durante la planificación de solo lectura.

Fase D — Aprobación:
- Presentar el plan antes de implementar cambios sustanciales.
- Obtener aprobación para operaciones destructivas, migraciones irreversibles, despliegues, gastos, cambios de permisos o efectos externos.
- No pedir aprobación para cada edición rutinaria incluida en un plan ya aprobado.
- Respetar los permisos y confirmaciones de la herramienta.

Fase E — Implementación:
- Antigravity implementa el plan aprobado.
- Trabajar por unidades pequeñas y coherentes.
- Revisar el contexto inmediato antes de modificar un archivo.
- Preservar cambios previos del usuario.
- No modificar archivos fuera del alcance sin justificación.
- Si el plan resulta incorrecto, detener la parte afectada, explicar el motivo y actualizarlo.

Fase F — Verificación:
- Ejecutar las pruebas pertinentes.
- Revisar errores, regresiones y criterios de aceptación.
- No confundir comandos ejecutados con pruebas exitosas.
- Si una prueba no puede ejecutarse, explicar por qué.
- No afirmar que se verificó algo sin evidencia.

Fase G — Revisión independiente:
- Codex revisa el diff y los criterios de aceptación.
- Priorizar defectos reales, seguridad, regresiones y omisiones.
- No repetir la inspección completa del proyecto.
- Las recomendaciones no se aplican automáticamente: Antigravity implementa las correcciones autorizadas.

Fase H — Cierre:
- Registrar cambios, pruebas, resultados, riesgos y pendientes.
- Actualizar el estado de las tareas.
- Indicar claramente qué queda sin verificar.
- Dejar el repositorio en un estado comprensible y trazable.

## 5. Contrato de comunicación
Toda entrega entre agentes debe contener:
- Objetivo.
- Estado actual.
- Archivos relevantes.
- Acción solicitada.
- Restricciones.
- Criterios de aceptación.
- Pruebas requeridas.
- Resultado y bloqueos, cuando corresponda.

No transmitir historiales completos si un resumen y referencias a archivos son suficientes.

## 6. Seguridad y control de cambios
- Inspeccionar git status antes de editar cuando Git esté disponible.
- No descartar cambios ajenos ni restablecer archivos indiscriminadamente.
- No revelar ni copiar secretos, credenciales, tokens, claves privadas o archivos .env.
- No desactivar protecciones para evitar una confirmación.
- No instalar dependencias innecesarias.
- No realizar operaciones destructivas o externas sin autorización.
- Si no hay Git, advertirlo y valorar una copia de seguridad antes de cambios amplios.

## 7. Gestión de errores
- Reproducir o localizar el error antes de corregirlo cuando sea viable.
- Identificar causa probable y evidencia.
- Aplicar la corrección mínima que resuelva el problema.
- Repetir la prueba que falló y las pruebas relacionadas.
- Limitar intentos repetidos sin información nueva.
- Si dos intentos equivalentes fallan, reconsiderar la hipótesis y comunicar el bloqueo.

## 8. Eficiencia
- No repetir análisis globales sin cambios relevantes.
- No pedir a varios agentes que resuelvan el mismo problema en paralelo sin una razón concreta.
- Utilizar el modelo más económico que cumpla los requisitos.
- Delegar cuando la dificultad o el valor de una revisión justifiquen el consumo.
- Mantener planes y resúmenes concisos, pero suficientes para ejecutar y verificar.
- No inventar porcentajes de ahorro ni datos de consumo.
- Medir cuotas con herramientas oficiales cuando estén disponibles.

## 9. Criterio de finalización
Una tarea solo se considera completada cuando:
- Se satisfacen los criterios de aceptación aplicables.
- Los cambios están identificados.
- Las pruebas realizadas tienen resultados documentados.
- Los riesgos y elementos no verificados se declaran.
- No quedan bloqueos conocidos ocultos.
