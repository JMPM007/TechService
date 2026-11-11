## Descripción

Los pequeños y medianos negocios de mantenimiento y reparación de computadores,
celulares y otros dispositivos tecnológicos suelen gestionar clientes, equipos y
Órdenes de forma dispersa: cuadernos, hojas de cálculo o herramientas aisladas.
Esto genera pérdida o duplicidad de información, dificultad para conocer el estado
de una reparación, confusión sobre los equipos que permanecen en el local y
Ausencia de un historial organizado de servicios.

Este proyecto es una plataforma web que centraliza la gestión y el seguimiento
de las órdenes de servicio técnico, desde la recepción del equipo hasta su entrega
y la consulta del historial. Permite registrar clientes, dispositivos y técnicos;
documentar fallas y diagnósticos; generar cotizaciones con aprobación o rechazo;
registrar servicios y repuestos utilizados; controlar el acceso mediante roles
(Administrador, Técnico y Cliente) y conservar un historial de las operaciones
relevantes.

Objetivo: desarrollar en un máximo de 11 semanas una plataforma funcional que
Mejore la organización, la trazabilidad y la eficiencia del proceso de
Servicio técnico.

> Proyecto académico (MVP) desarrollado para Proyecto Informático I,
> Universidad Autónoma de Occidente, Cali, 2026.


Capa	Tecnología
Frontend	React + Vite
Backend	Node.js + Express
Base de datos	mysql2
Autenticación	JWT + bcrypt
Control de versiones	Git + GitHub

Estructura del repositorio.
├── main    
├── develop
├── feature/HU16-17-18-gestion-ordenes
├── feature/HU-01_Crear_usuario-HU-02_login
├──feature/HU-11-LISTA-DISPONIBILIDAD
├──feature/HU-12-REGISTRAR-EQUIPO
├──feature/hu-06-perfil-contrasena
├──feature/hu-08-client-management
├──feature/hu-10-Registrar-Tecnico
├──feature/registro-cliente
...



Rama	Propósito	Reglas
main	Versión estable / demostrable	Solo recibe merges desde develop vía Pull Request. Nunca se hace push directo.
develop	Integración del trabajo en curso	Recibe las ramas de trabajo vía Pull Request.
feature/<nombre>	Nueva funcionalidad	Sale de develop, vuelve a develop.
fix/<nombre>	Corrección de errores	Sale de develop, vuelve a develop.
docs/<nombre>	Documentación	Sale de develop, vuelve a develop.
hotfix/<nombre>	Error urgente en main	Sale de main, vuelve a main y a develop.

Flujo de trabajo
Actualizar develop: git checkout develop && git pull origin develop
Crear rama de trabajo: git checkout -b feature/gestion-clientes
Hacer commits pequeños siguiendo la convención.
Subir la rama: git push -u origin feature/gestion-clientes
Abrir un Pull Request hacia develop, con al menos 1 revisión de otro integrante.
Resolver conflictos en local (git merge develop dentro de tu rama) antes de aprobar.

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

Equipo
Juan Miguel Perdomo Muñoz
Juan Camilo Gonzales Rodas
José David Aguirre
Gabriel Armando Gil


