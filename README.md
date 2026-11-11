# TechService

Plataforma académica para gestionar clientes, equipos y órdenes de servicio técnico. Proyecto Informático I, Universidad Autónoma de Occidente, Cali, 2026.

## Documentación HU-39 y HU-40

- [Arquitectura y tecnologías](docs/arquitectura.md): capas, versiones, carpetas, JWT y roles.
- [Instalación](docs/instalacion.md): requisitos, entorno, MySQL y ejecución.
- [API](docs/api.md): endpoints, permisos, parámetros, respuestas y ejemplos.
- [Modelo de datos](docs/datos.md): diagrama ER y diccionario de schema.sql.
- [Reglas de negocio](docs/reglas-negocio.md): estados y restricciones.
- [CI y despliegue](docs/despliegue.md): estado actual y procedimiento Render.
- [Entrega por PR](docs/entrega-hu39-hu40.md): criterios, limitaciones e integración.

Documentación contrastada con el código de `48a2f72`. Las guías distinguen comportamiento implementado y configuración pendiente.

## Inicio local

Preparar MySQL y variables siguiendo la [guía de instalación](docs/instalacion.md). Desde la raíz:

```sh
npm ci
npm --prefix backend ci
```

Terminal 1: `cd backend` y `npm run dev`. Terminal 2, raíz: `npm run dev`.
Frontend: `http://localhost:5173`. API: `http://localhost:3000/api`.

## Pruebas (QA)

Framework: **Vitest** en frontend y backend. Se eligió porque el proyecto usa
módulos ES nativos y Vite: Vitest los ejecuta sin configuración adicional
(Jest requiere transpilar ESM), permite simular módulos con `vi.mock` y trae
medición de cobertura con `@vitest/coverage-v8`.

| Parte    | Ubicación de las pruebas        | Entorno | Configuración                      |
|----------|---------------------------------|---------|------------------------------------|
| Backend  | `backend/test/**/*.test.js`     | Node    | `backend/vitest.config.js`         |
| Frontend | `src/**/*.test.{js,jsx}`        | jsdom   | `vite.config.js` (bloque `test`)   |

Comandos (en la raíz para el frontend, o dentro de `backend/` para el backend):

```bash
npm install            # instala dependencias, incluidas las de pruebas
npm test               # ejecuta las pruebas una vez
npm run test:watch     # vuelve a ejecutar al guardar cambios
npm run test:coverage  # genera el reporte de cobertura en coverage/
```

Reglas:
- Las pruebas **no usan la base de datos real**. En el backend el pool de MySQL
  (`src/config/db.js`) o el modelo se reemplazan con `vi.mock`; las variables
  de entorno de prueba son ficticias y están en `backend/vitest.config.js`.
- En el frontend `fetch` se simula con `vi.stubGlobal('fetch', ...)`.
- Los archivos se nombran `<modulo>.test.js` (o `.test.jsx` si renderizan JSX).
- `backend/test/helpers/http.js` trae `mockRequest` y `mockResponse` para probar
  controladores sin levantar Express.
- Ejemplos de referencia: `backend/test/entornoPruebas.test.js` y
  `src/test/entornoPruebas.test.jsx`.


## Colaboración

Rama de trabajo → Pull Request a `develop` → revisión de otro integrante → integración. `main` recibe la versión estable desde `develop` mediante PR. Actualizar las guías en el mismo PR que modifica API o SQL. No subir `.env`, contraseñas ni tokens.

Equipo: Juan Miguel Perdomo Muñoz, Juan Camilo Gonzales Rodas, José David Aguirre y Gabriel Armando Gil.
