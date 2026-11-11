# Entrega de HU-39 y HU-40

## Evidencia y alcance

| Criterio | Documento / estado |
| --- | --- |
| Capas React/Vite, Express y MySQL con diagrama | arquitectura.md |
| Tecnologías, versiones y carpetas reales | arquitectura.md |
| JWT y permisos por rol | arquitectura.md y api.md |
| Instalación, entorno, schema.sql y base.sql | instalacion.md y archivos .env.example |
| Pipeline y Render | despliegue.md: estado actual y procedimiento propuesto; activación pendiente |
| Endpoints por todos los módulos, entradas y códigos | api.md |
| Autenticación Bearer y ejemplos de éxito/error | api.md |
| Diagrama ER y diccionario completo | datos.md |
| Estados y reglas reales | reglas-negocio.md |
| Versionado e integración por PR | Archivos preparados; PR pendiente |

No se considera completada la integración hasta abrir, revisar y fusionar el PR. Estas guías no afirman haber probado despliegue, MySQL remoto o endpoints con datos reales. No se modifican reglas del producto ni se activan servicios externos.

## Crear el Pull Request

El flujo del README original propone salir de develop y volver por PR. Con el árbol limpio en el punto de partida apropiado (confirmar que develop contiene el código documentado), crear rama; los comandos siguientes son una guía, no acciones ya ejecutadas:

```sh
git switch -c feature/HU-39-HU-40-documentacion
 git add README.md docs .env.example backend/.env.example
 git diff --cached --check
 git commit -m "docs: documentar arquitectura API y datos HU-39 HU-40"
 git push -u origin feature/HU-39-HU-40-documentacion
```

Abrir en GitHub **Compare & pull request**, base develop. Verificar diferencias con la base antes de publicar; pedir revisión a otro integrante. No hacer push directo a main.

Título sugerido: `docs: documentar arquitectura, API y datos (HU-39 y HU-40)` por ejemplo.

Descripción sugerida:

> Añade guías de arquitectura, tecnologías, instalación, JWT y permisos; catálogo de API por módulo con parámetros/códigos/ejemplos; diagrama ER, diccionario de las 15 tablas y reglas de estados. Sustituye el README por un índice y añade ejemplos de entorno sin credenciales.
>
> Documenta por separado la ausencia de workflows/Render, las URLs localhost y la diferencia fecha_asignacion entre código y esquema. CI/CD se presenta como procedimiento propuesto; su activación y las correcciones funcionales quedan pendientes.
>
> Validación: completar con los resultados reales de npm --prefix backend test, npm run lint, npm run build y revisión de cobertura documental antes de abrir el PR.

## Revisión de mantenimiento

Al cambiar rutas comprobar método, prefijo montado, middleware, controlador y modelo. Al cambiar schema.sql actualizar todas las columnas, FK, CHECK, índices y cardinalidades del diagrama. Revisar Mermaid en GitHub al abrir el PR y comprobar que los enlaces Markdown son navegables. Las reglas de negocio describen las validaciones efectivas; no convertir un flujo sugerido en garantía que el código no impone.

## Integración Ejemplo

Rama de entrega: feature/HU-39-HU-40-documentacion, creada desde origin/develop (48a2f72). La documentación incorpora administración de usuarios, desactivación, recuperación de contraseña, SMTP y las 15 tablas de esa base. La integración final requiere revisión y merge del PR a develop.

## Validación previa al PR

- Backend: 110 pruebas aprobadas en ocho archivos (`npm --prefix backend test`).
- Frontend: 14 pruebas aprobadas en tres archivos (`npm test`).
- `npm run lint`: cero errores y dos advertencias preexistentes de dependencias useEffect en DirectorioClientes.jsx y FichaTecnica.jsx.
- `npm run build`: correcto.
- Las 59 rutas de routers más /test-db están catalogadas; las 15 tablas y todas sus columnas aparecen en el diccionario. Enlaces locales comprobados.
- Entorno de ejecución observado: Node 22.17.0 / npm 10.9.2. Las pruebas pasan en este entorno, aunque jsdom y algunas dependencias declaran una versión superior; para instalaciones nuevas se documenta 22.22.2+ de la serie 22.
- No se probó MySQL real, SMTP, despliegue Render ni renderizado Mermaid en GitHub.
