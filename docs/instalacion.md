# Instalación desde cero

## Requisitos

Git, npm, Node.js 22.22.2+ de la serie 22 y MySQL 8.0.16+ como objetivo local; el repositorio no fija sus versiones. Vite requiere al menos Node 22.12 en esa serie; ESLint 10 requiere al menos 22.13 y jsdom 30.1.3 exige 22.22.2 en esa serie. Tener MySQL encendido, cliente `mysql` y dos terminales. Puertos locales 3000 y 5173.

```sh
 git clone https://github.com/JMPM007/TechService.git
 cd TechService
 npm ci
 npm --prefix backend ci
```

## Base de datos

Desde la raíz ejecutar `mysql -u root -p` con una cuenta administrativa. Dentro del cliente MySQL:

```sql
SOURCE database/schema.sql;
SOURCE database/base.sql;
SHOW TABLES;
CREATE USER 'techservice_app'@'localhost' IDENTIFIED BY 'REEMPLAZAR_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON techservice_db.* TO 'techservice_app'@'localhost';
```

SOURCE funciona también desde Windows usando `/` en rutas. Primero schema.sql y después base.sql; ambos seleccionan techservice_db. Se esperan 15 tablas. base.sql crea dos usuarios y dos clientes; no crea fichas de técnicos, equipos ni órdenes. No hay contraseña utilizable documentada para sus hashes de ejemplo.

CREATE TABLE IF NOT EXISTS no actualiza una base antigua. Estos pasos son para una base nueva. En bases existentes respaldar y revisar individualmente backend/src/config/migrateHu*.js: son scripts históricos, fuerzan SSL y no se ejecutan automáticamente al iniciar. No cubren fecha_asignacion.

## Entorno

En PowerShell desde raíz:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Editar los valores de ejemplo. No subir los .env reales.

| Variable | Archivo | Función |
| --- | --- | --- |
| VITE_API_URL | .env raíz | http://localhost:3000/api; incluir /api sin barra final; público en el build |
| PORT | backend/.env | Puerto API, por defecto 3000 |
| DB_HOST | backend/.env | Host MySQL |
| DB_PORT | backend/.env | Puerto, por defecto 3306 en db.js |
| DB_USER | backend/.env | Usuario de aplicación |
| DB_PASSWORD | backend/.env | Contraseña de MySQL |
| DB_NAME | backend/.env | techservice_db según SQL |
| DB_SSL | backend/.env | Solo `true` activa TLS; usar false local sin TLS |
| JWT_SECRET | backend/.env | Secreto aleatorio largo y privado; necesario para login y JWT |

Generar secreto con `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` y copiar la salida a JWT_SECRET. No poner secretos en VITE_*. db.js usa rejectUnauthorized:false con TLS y no lee ca.pem.

## Arranque

Terminal 1, desde backend (dotenv busca .env en el directorio de ejecución):

```sh
cd backend
npm run dev
```

API http://localhost:3000/api. `npm start` inicia sin watch en esa misma carpeta. El mensaje de arranque no comprueba MySQL; las consultas lo hacen al ejecutarse.

Terminal 2, desde raíz:

```sh
npm run dev
```

Abrir la URL que muestre Vite, normalmente http://localhost:5173. Reiniciar después de cambiar entorno.

## Primera cuenta

1. Registrar una cuenta propia por interfaz o POST /api/usuarios (ver [ejemplos](api.md#ejemplos-de-consumo)); crea CLIENTE y ficha provisional con cédula USR-id, apellido Por completar y teléfono No proporcionado.
2. Entrar con esa cuenta y consultar GET /api/perfil/me con token para verificar API, MySQL y JWT.
3. Para ADMIN local crear otra cuenta, y desde MySQL administrativo ejecutar `UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'admin.local@example.com';` usando el correo real de esa cuenta. Volver a iniciar sesión. ADMIN crea técnicos con POST /api/tecnicos/register; cambiar solo el rol a TECNICO no crea la ficha necesaria para diagnósticos.

## Verificación

```sh
npm --prefix backend test
npm test
npm run lint
npm run build
```

`npm run preview` sirve el build local. test_hu_suite.js necesita API y datos específicos, hace peticiones sin token en rutas protegidas y no constituye una prueba de instalación limpia; no ejecutarlo contra producción.

| Problema | Comprobación |
| --- | --- |
| Error JWT_SECRET | Variable configurada, arranque desde backend |
| Error MySQL | Servicio, permisos, puerto, credenciales y DB_SSL |
| Login semilla falla | Crear cuenta propia; password de semillas desconocido |
| Columna fecha_asignacion desconocida | Diferencia código/esquema documentada; requiere corrección SQL revisada |
| Frontend remoto usa localhost | URLs fijas descritas en arquitectura |
| 401 / 403 | Token vigente y rol admitido; volver a entrar tras cambiar rol |

## Recuperación de contraseña y correo (HU-04)

Una base nueva ya incluye password_reset_tokens y usuarios.activo. Para bases existentes revisar `npm run migrate:hu03-hu05` y `npm run migrate:hu04` desde backend después de respaldar. No sustituyen otras migraciones.

| Variable backend | Predeterminado / propósito |
| --- | --- |
| FRONTEND_URL | http://localhost:5173; base del enlace /restablecer-contrasena?token=… |
| PASSWORD_RESET_TTL_MINUTES | 30; admite enteros entre 1 y 1440 |
| SMTP_HOST | Host de correo; sin él en desarrollo se imprime enlace en consola |
| SMTP_PORT | 587 si no se configura |
| SMTP_SECURE | Solo true habilita secure en Nodemailer |
| SMTP_USER / SMTP_PASSWORD | Credenciales opcionales según proveedor |
| SMTP_FROM | TechService <no-reply@techservice.local> si no se configura |
| NODE_ENV | production impide usar el fallback de consola sin SMTP |

En producción configurar SMTP y FRONTEND_URL real. La respuesta genérica de solicitud no confirma entrega; revisar logs si no llega el correo. En desarrollo el enlace de consola permite completar el flujo sin SMTP.

Vitest se usa en ambos paquetes: `npm test`, `npm run test:watch` y `npm run test:coverage` desde raíz/frontend o backend. Backend simula pool/modelos y frontend simula fetch bajo jsdom. No requieren base real ni credenciales productivas.
