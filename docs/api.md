# API REST — HU-40

Base local: `http://localhost:3000/api`. Todas las rutas de las tablas son relativas a esa base. Cuerpos JSON con `Content-Type: application/json`. Respuestas JSON; la API no usa un único envoltorio: aparecen `mensaje`, `error`, `message`, `success`, `data` o arreglos según el módulo. DECIMAL puede llegar como cadena desde mysql2. Los ID de ejemplos son ilustrativos: usar registros reales.

## Autenticación y códigos comunes

Obtener token en POST /usuarios/login y enviarlo en cada petición protegida:

```http
Authorization: Bearer <token>
```

Roles de las tablas: A = ADMIN, T = TECNICO, C = CLIENTE. Público = sin JWT. Cada fila indica autenticación y roles. Todas las rutas protegidas pueden devolver además **401** (token ausente, formato distinto de Bearer, firma inválida o expirado), **403** (usuario inexistente/inactivo o rol no autorizado, cuando aplica authorizeRoles) y **500** (JWT_SECRET ausente). Todas las operaciones de datos pueden devolver **500** por error interno/SQL. Estos códigos se suman a los de cada fila. Ruta desconocida: **404**, `{"mensaje":"Ruta no encontrada."}`. JSON mal formado puede ser rechazado por Express con **400** y cuerpo no JSON; no existe manejador JSON global de errores.

Salvo indicación contraria: parámetros :id, :ordenId, :equipoId y :servicioId representan IDs; q/search/estado/marca/numeroSerie se envían como query string; las demás entradas de escritura van en el cuerpo. `?` indica opcional, no parte del nombre. Consultar las restricciones de [reglas](reglas-negocio.md).

## Usuarios y autenticación

| Método y ruta | Descripción | JWT / roles | Cuerpo | Códigos propios |
| --- | --- | --- | --- | --- |
| POST /usuarios | Registrar usuario y ficha CLIENTE provisional | No / público | nombre (2–100), email, password (mínimo 8 caracteres y máximo 72 bytes UTF-8) | 201, 400, 409 |
| POST /usuarios/login | Iniciar sesión; devuelve token de 8 horas y usuario | No / público | email, password | 200, 400, 401, 403 |
| GET /usuarios | Listar usuarios sin password | Sí / A | query rol? (ADMIN/TECNICO/CLIENTE), activo? (0/1) | 200, 400 |
| GET /usuarios/:id | Consultar usuario | Sí / A | path id entero positivo | 200, 400, 404 |
| PUT /usuarios/:id | Editar usuario | Sí / A | nombre? (2–100), email? válido, rol?; al menos uno | 200, 400, 403, 404, 409 |
| PATCH /usuarios/:id/estado | Activar/desactivar cuenta | Sí / A | activo: 0/1 o booleano | 200, 400, 403, 404, 409 |
| POST /usuarios/recuperar-contrasena | Solicitar enlace por correo | No / público | email válido, máximo 100 | 200, 400 |
| GET /usuarios/restablecer-contrasena/:token | Validar enlace vigente sin consumirlo | No / público | token hexadecimal minúsculo de 64 caracteres | 200, 400 |
| POST /usuarios/restablecer-contrasena | Consumir token y cambiar password | No / público | token, nuevaContrasena, confirmacionContrasena | 200, 400 |

La edición impide cambiar el propio rol y degradar al último ADMIN activo. La desactivación impide modificar el propio estado, desactivar al último ADMIN activo o repetir el estado actual (409). Editar email duplicado produce 409. El middleware consulta activo y rol actuales en MySQL, sin depender del rol antiguo en el JWT.

Recuperación: respuesta uniforme aunque correo no exista, esté inactivo o exceda tres solicitudes en quince minutos. Token de un solo uso, 30 minutos por defecto; emitir otro invalida los anteriores. Nueva contraseña con mínimo ocho caracteres, máximo 72 bytes UTF-8, mayúscula, minúscula y número; debe coincidir con confirmación y diferir de la actual. No cambia las políticas de registro o perfil.

No existen POST /usuarios/register ni GET /usuarios/perfil. El rol enviado en registro no concede privilegios.

## Perfil

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| GET /perfil/me | Perfil de usuario del token | Sí / A,T,C; middleware no filtra rol | Sin cuerpo | 200, 404 |
| PUT /perfil/me | Actualizar nombre/email propios | Sí / A,T,C; sin filtro de rol | nombre? (2–100), email? válido y máximo 100; al menos uno | 200, 400, 404, 409 |
| PUT /perfil/me/password | Cambiar contraseña propia | Sí / A,T,C; sin filtro de rol | contrasenaActual, nuevaContrasena, confirmacionContrasena | 200, 400, 401, 404 |

Nueva contraseña: mínimo 8 caracteres, máximo 72 bytes UTF-8, confirmación idéntica y distinta de la actual. El endpoint no invalida JWT existentes.

## Clientes

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| POST /clientes | Registrar ficha sin cuenta | No / público | cedula, nombres, apellidos, telefono (7–15 dígitos), email válido; todos obligatorios | 201, 400, 409 |
| GET /clientes | Directorio filtrable | Sí / A,T | query search? | 200 |
| GET /clientes/cedula/:cedula | Buscar cédula exacta | Sí / A,T | path cedula | 200, 400, 404 |
| DELETE /clientes/:id | Eliminar ficha sin equipos asociados | Sí / A | path id entero positivo | 200, 400, 404, 409 |

## Técnicos

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| POST /tecnicos/register | Crear usuario TECNICO y ficha | Sí / A | nombre, email, password, cedula, telefono, especialidad | 201, 400, 409 |
| GET /tecnicos | Listar técnicos | Sí / A | Sin cuerpo | 200 |
| PATCH /tecnicos/:id/estado | Modificar disponibilidad | Sí / A | estado: DISPONIBLE, OCUPADO o INACTIVO | 200, 400 |

PATCH no comprueba filas afectadas: no garantiza 404 para ID inexistente. El alta de técnico verifica campos presentes y duplicados; no aplica el validador de contraseña del registro CLIENTE.

## Equipos

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| POST /equipos | Registrar equipo para cédula existente | Sí / A,T | cedula, tipo, marca, modelo, numero_serie | 201, 400, 404, 409 |
| GET /equipos | Listar fichas | Sí / A,T | query search? | 200 |
| GET /equipos/mis-equipos | Equipos vinculados al usuario | Sí / C | Sin cuerpo | 200 |
| GET /equipos/cliente/:clienteId | Equipos de cliente por ID | Sí / A,T,C | path clienteId; no comprueba propiedad | 200 |
| GET /equipos/buscar | Buscar marca y serial | Sí / A,T | query marca y numeroSerie obligatorios | 200, 400, 404 |
| GET /equipos/serie/:serie | Buscar serial exacto | Sí / A,T | path serie | 200, 400, 404 |
| GET /equipos/:equipoId/historial | Historial; CLIENTE solo propietario | Sí / A,T,C | path equipoId | 200, 400, 404 |
| PUT /equipos/:equipoId | Editar ficha | Sí / A,T | tipo, marca, modelo, numeroSerie; procesador?, memoriaRam?, almacenamiento?, tarjetaGrafica?, sistemaOperativo?, estadoFisico?, accesorios?, observaciones? | 200, 400, 404, 409 |
| GET /equipos/:equipoId | Obtener ficha por ID | Sí / A,T | path equipoId | 200, 400, 404 |

La creación usa numero_serie y la edición numeroSerie. El esquema no declara UNIQUE en numero_serie: el código de edición busca duplicados, pero no asumir unicidad garantizada por SQL.

## Órdenes y diagnósticos

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| POST /ordenes | Crear orden básica RECIBIDA | Sí / T | equipoId, observacion? | 201, 400, 404, 409 |
| POST /ordenes/servicio | Crear recepción completa PENDIENTE | Sí / T | equipoId, motivoIngreso, tipoServicio; tecnicoId?, prioridad? (MEDIA), costoEstimado? (0), abonoInicial? (0), observacionesRecepcion? | 201, 400, 404 |
| GET /ordenes | Listar órdenes | Sí / A,T | query search?, estado? | 200 |
| GET /ordenes/:ordenId | Consultar orden | Sí / A,T | path ordenId | 200, 400, 404 |
| PATCH /ordenes/:ordenId/asignar | Asignar técnico existente no inactivo | Sí / A | tecnicoId | 200, 400, 404, 409 |
| PATCH /ordenes/:ordenId/estado | Cambiar estado con historial | Sí / A,T | estado, observacion? | 200, 400, 404, 409 |
| PATCH /ordenes/:ordenId/cerrar | Cambiar a COMPLETADO | Sí / A,T | observacion? | 200, 400, 404, 409; falta aprobación produce 500 actualmente |
| GET /ordenes/:ordenId/historial | Consultar historial por ID o código | Sí / A,T | path ordenId admite OS-año-secuencia | 200, 400, 404 |
| POST /ordenes/diagnostico | Crear orden y diagnóstico juntos | Sí / T | equipoId y cuerpo Diagnóstico | 201, 400, 403, 404, 409 |
| POST /ordenes/:ordenId/diagnostico | Crear único diagnóstico de orden | Sí / T | cuerpo Diagnóstico | 201, 400, 403, 404, 409 |
| PUT /ordenes/:ordenId/diagnostico | Actualizar diagnóstico existente | Sí / T | cuerpo Diagnóstico | 200, 400, 404 |
| GET /ordenes/:ordenId/diagnostico | Consultar diagnóstico | Sí / A,T | path ordenId | 200, 400, 404 |

**Diagnóstico:** descripcion, fallaEncontrada, fechaDiagnostico obligatorios; fecha con patrón YYYY-MM-DD o inicio YYYY-MM-DDT…; recomendaciones?, procedimientos?, observaciones?. El patrón no valida todas las fechas de calendario. Crear requiere ficha técnica asociada al usuario TECNICO. Actualizar no verifica que sea el técnico asignado o creador.

**Recepción:** tipoServicio debe ser Mantenimiento Preventivo, Mantenimiento Correctivo, Diagnóstico Técnico, Garantía o Instalación Hardware/Software. prioridad: BAJA, MEDIA, ALTA, URGENTE. Costos y abonos finitos y no negativos. No se valida abono ≤ costo. Asignación depende de la columna faltante fecha_asignacion (ver arquitectura).

## Cotizaciones

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| POST /ordenes/:ordenId/cotizacion | Crear cotización; exige diagnóstico | Sí / A,T | conceptos: arreglo no vacío de Concepto | 201, 400, 409 |
| GET /ordenes/:ordenId/cotizacion | Consultar conceptos y decisiones; CLIENTE propietario | Sí / A,T,C | path ordenId | 200, 400, 403, 404 |
| PUT /ordenes/:ordenId/cotizacion/conceptos | Reemplazar conceptos si pendiente | Sí / A,T | conceptos: arreglo no vacío de Concepto | 200, 400, 404, 409 |
| PATCH /ordenes/:ordenId/cotizacion/estado | Cancelar cotización | Sí / A | estado: CANCELADA; otros estados válidos dan 403 | 200, 400, 403, 404, 409 |
| PATCH /ordenes/:ordenId/cotizacion/decision | Decisión única de cliente propietario | Sí / C | estado: APROBADA o RECHAZADA | 200, 400, 403, 404, 409 |

**Concepto:** tipo SERVICIO/MANO_OBRA/REPUESTO, descripcion no vacía, cantidad > 0, precioUnitario ≥ 0, observaciones?. Subtotal y total se calculan en servidor, incluyen mano de obra separada y se redondean a dos decimales; ver reglas para evitar duplicarla.

## Repuestos

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| POST /ordenes-repuestos/nuevorepuesto | Alta de inventario | Sí / A,T | nombre (máximo 100), precio_unitario ≥ 0, descripcion? texto/null, stock? entero ≥ 0 (0) | 201, 400 |
| GET /ordenes-repuestos/inventario | Inventario completo | Sí / A,T | Sin cuerpo | 200 |
| POST /ordenes-repuestos/reabastecimiento | Sumar existencias | Sí / A,T | repuesto_id entero positivo, cantidad entera positiva | 200, 400 (también inexistente) |
| POST /ordenes-repuestos/orden | Consumir stock y asociarlo a orden | Sí / A,T | orden_id, repuesto_id, cantidad entera positiva | 201, 400, 404, 409 (stock insuficiente) |

El precio se toma de inventario, no del cliente. Asociación y descuento se realizan en transacción con bloqueo del repuesto. Un repuesto idéntico por nombre/descripción devuelve 400 en el alta.

## Mano de obra

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| GET /ordenes/:ordenId/mano-obra | Listar servicios | Sí / A,T | path ordenId | 200, 400 |
| POST /ordenes/:ordenId/mano-obra | Registrar servicio | Sí / A,T | descripcion, costo ≥ 0, tiempoMinutos? entero positivo o null | 201, 400, 404, 409 |
| PUT /ordenes/:ordenId/mano-obra/:servicioId | Editar servicio de esa orden | Sí / A,T | descripcion, costo ≥ 0, tiempoMinutos? entero positivo o null | 200, 400, 404, 409 |
| DELETE /ordenes/:ordenId/mano-obra/:servicioId | Eliminar servicio | Sí / A,T | Sin cuerpo | 200, 400, 404, 409 |

Las escrituras se bloquean si existe cotización fuera de PENDIENTE_APROBACION. GET devuelve servicios vacíos incluso si el ID no corresponde a una orden; no valida existencia.

## Comprobantes de recepción

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| GET /ordenes/:ordenId/recepcion/datos | Datos para preparar comprobante | Sí / A,T | path ordenId | 200, 400, 404 |
| POST /ordenes/:ordenId/recepcion/comprobante | Generar comprobante único | Sí / A,T | fallaReportada?, estadoFisico?, accesorios?, observaciones? | 201, 400, 404, 409 |
| GET /ordenes/:ordenId/recepcion/comprobante | Consultar; CLIENTE propietario | Sí / A,T,C | path ordenId | 200, 400, 403, 404 |

Falla, estado físico y accesorios deben quedar completos: si se omiten se toman de orden/equipo. El endpoint devuelve JSON, no un PDF.

## Consultas

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| GET /consultas/ordenes/:codigo | Seguimiento propio con historial | Sí / C | codigo no vacío y máximo 30 | 200, 400, 404 |
| GET /consultas/dashboard | Conteos por los diez estados y total | Sí / A,T | Sin cuerpo | 200 |
| GET /consultas/buscar | Buscar cédula, serie o código | Sí / A,T | query q obligatorio de hasta 100 caracteres | 200, 400 |

## Diagnóstico de conexión

| Método y ruta | Descripción | JWT / roles | Entrada | Códigos propios |
| --- | --- | --- | --- | --- |
| GET /test-db | Ejecuta SELECT 1 y comprueba conexión MySQL | No / público | Sin cuerpo | 200, 500 |

Es público; devuelve status ok/error y mensaje de conexión, sin datos de usuarios.

## Ejemplos de consumo

Usar curl en bash o `curl.exe` en PowerShell; los ejemplos HTTP son independientes del shell. Respuestas con IDs ilustrativos; campos de fecha/token dependen de ejecución. Los ejemplos de listas vacías son respuestas completas válidas cuando no existen registros.

### Registro y login

```http
POST /api/usuarios HTTP/1.1
Content-Type: application/json

{"nombre":"Cliente Demo","email":"demo@example.com","password":"DemoLocal123!"}
```

201:

```json
{"mensaje":"Usuario registrado correctamente.","usuario":{"id":3,"nombre":"Cliente Demo","email":"demo@example.com","rol":"CLIENTE","clienteInfo":3}}
```

Repetir correo: 409:

```json
{"mensaje":"El correo electrónico ya está registrado."}
```

```http
POST /api/usuarios/login HTTP/1.1
Content-Type: application/json

{"email":"demo@example.com","password":"DemoLocal123!"}
```

200 (token representado por un marcador):

```json
{"mensaje":"Inicio de sesión exitoso.","token":"<jwt-firmado>","usuario":{"id":3,"nombre":"Cliente Demo","email":"demo@example.com","rol":"CLIENTE"}}
```

Contraseña incorrecta: 401:

```json
{"mensaje":"Credenciales inválidas."}
```

### Perfil y autorización

```http
PUT /api/perfil/me HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{"nombre":"Cliente Actualizado"}
```

200:

```json
{"mensaje":"Datos personales actualizados correctamente.","usuario":{"id":3,"nombre":"Cliente Actualizado","email":"demo@example.com","rol":"CLIENTE","creadoEn":"2026-11-11T12:00:00.000Z"}}
```

Sin token: 401 `{"mensaje":"Debes iniciar sesión para acceder a este recurso."}`. Un CLIENTE en GET /api/ordenes recibe 403 `{"mensaje":"No tienes permisos para realizar esta acción."}`.

### Cliente y equipo

```http
POST /api/clientes HTTP/1.1
Content-Type: application/json

{"cedula":"1000012345","nombres":"Ana","apellidos":"Pérez","telefono":"3001234567","email":"ana@example.com"}
```

GET /api/clientes?search=sin-coincidencias con token ADMIN devuelve 200 `{"success":true,"total":0,"clientes":[]}`. En el POST anterior un teléfono `abc` produce 400 `{"error":"El teléfono no tiene un formato válido"}`.

```http
POST /api/equipos HTTP/1.1
Authorization: Bearer <token-admin-o-tecnico>
Content-Type: application/json

{"cedula":"1000012345","tipo":"Portátil","marca":"Lenovo","modelo":"T14","numero_serie":"DEMO-T14-01"}
```

201:

```json
{"mensaje":"Equipo registrado exitosamente","equipo":{"id":1,"cliente_id":4,"tipo":"Portátil","marca":"Lenovo","modelo":"T14","numero_serie":"DEMO-T14-01"}}
```

Cédula inexistente: 404 `{"error":"No se encontró ningún cliente con la cédula ingresada"}`.

### Orden, diagnóstico y estado

```http
POST /api/ordenes HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"equipoId":1,"observacion":"Recepción inicial"}
```

GET /api/ordenes?search=sin-coincidencias con token T/A devuelve 200 `{"success":true,"total":0,"ordenes":[]}`. POST con equipoId 0 devuelve 400 `{"mensaje":"equipoId debe ser un número válido."}`.

```http
POST /api/ordenes/1/diagnostico HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"descripcion":"Prueba de encendido","fallaEncontrada":"Fuente averiada","fechaDiagnostico":"2026-11-11","recomendaciones":"Reemplazar fuente"}
```

Repetir diagnóstico existente: 409 `{"mensaje":"La orden ya tiene un diagnóstico registrado."}`.

```http
PATCH /api/ordenes/1/estado HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"estado":"EN_REPARACION","observacion":"Inicio de reparación"}
```

Sin cotización aprobada: 409:

```json
{"mensaje":"La reparación solo puede continuar cuando la cotización está aprobada por el cliente."}
```

### Cotización y decisión

```http
POST /api/ordenes/1/cotizacion HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"conceptos":[{"tipo":"REPUESTO","descripcion":"Fuente","cantidad":1,"precioUnitario":120000}]}
```

Sin diagnóstico: 400 `{"mensaje":"La orden debe existir y tener un diagnóstico registrado."}`.

```http
PATCH /api/ordenes/1/cotizacion/decision HTTP/1.1
Authorization: Bearer <token-cliente-propietario>
Content-Type: application/json

{"estado":"APROBADA"}
```

Decisión repetida: 409 `{"mensaje":"La cotización ya tiene una decisión registrada."}`. Propietario se determina por equipos.cliente_id → clientes.usuario_id; la ficha creada mediante POST /clientes no tiene usuario vinculado automáticamente.

### Repuestos y mano de obra

```http
POST /api/ordenes-repuestos/nuevorepuesto HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"nombre":"Fuente Demo","stock":2,"precio_unitario":120000}
```

201:

```json
{"message":"Repuesto registrado exitosamente en el inventario","data":{"id":1,"nombre":"Fuente Demo","descripcion":null,"stock":2,"precio_unitario":120000}}
```

```http
POST /api/ordenes-repuestos/orden HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"orden_id":1,"repuesto_id":1,"cantidad":3}
```

Con stock 2: 409 `{"error":"Stock insuficiente. Stock actual disponible: 2, cantidad solicitada: 3"}`.

```http
POST /api/ordenes/1/mano-obra HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"descripcion":"Instalación","costo":30000,"tiempoMinutos":45}
```

GET /api/ordenes/1/mano-obra sin servicios: 200 `{"servicios":[]}`. Modificar tras aprobar cotización: 409 `{"mensaje":"La cotización no permite modificar servicios de mano de obra en su estado actual."}`.

### Comprobante y seguimiento

```http
POST /api/ordenes/1/recepcion/comprobante HTTP/1.1
Authorization: Bearer <token-tecnico>
Content-Type: application/json

{"fallaReportada":"No enciende","estadoFisico":"Buen estado","accesorios":"Cargador"}
```

Repetir generación: 409 `{"mensaje":"La orden ya tiene un comprobante de recepción."}`.

```http
GET /api/consultas/ordenes/OS-2026-0001 HTTP/1.1
Authorization: Bearer <token-cliente-propietario>
```

200 (orden recién recibida, datos ilustrativos):

```json
{"orden":{"codigoOrden":"OS-2026-0001","estado":"RECIBIDA","fechaIngreso":"2026-11-11T12:00:00.000Z","equipo":{"tipo":"Portátil","marca":"Lenovo","modelo":"T14"},"tecnico":null},"historial":[{"estadoAnterior":null,"estadoNuevo":"RECIBIDA","creadoEn":"2026-11-11T12:00:00.000Z"}]}
```

Código ajeno/inexistente: 404 `{"mensaje":"No se encontró ninguna orden con ese código asociada a tu cuenta."}`.

### Respuestas exitosas de operaciones principales (campos seleccionados)

Los siguientes ejemplos muestran solo los campos indicados de respuestas más amplias; los objetos orden, diagnostico, cotizacion y comprobante también contienen los campos de sus consultas SQL. No constituyen respuestas completas ni fixtures de prueba.

| Petición anterior | HTTP | Campos seleccionados de respuesta |
| --- | --- | --- |
| POST /ordenes | 201 | mensaje: Orden registrada correctamente.; orden.id: 1; orden.estado: RECIBIDA; orden.codigo_orden: OS-2026-0001 |
| POST /ordenes/1/diagnostico | 201 | mensaje: Diagnóstico registrado correctamente.; id: 1; diagnostico.ordenId: 1; diagnostico.descripcion: Prueba de encendido |
| PATCH /ordenes/1/estado (con cotización aprobada) | 200 | mensaje: Estado actualizado correctamente.; orden.estado: EN_REPARACION |
| POST /ordenes/1/cotizacion | 201 | mensaje: Cotización registrada correctamente.; id: 1; cotizacion.estado: PENDIENTE_APROBACION; cotizacion.total: 120000.00 (sin mano de obra separada) |
| PATCH /ordenes/1/cotizacion/decision | 200 | mensaje: Cotización aprobada correctamente.; cotizacion.estado: APROBADA |
| POST /ordenes/1/mano-obra (mientras no esté bloqueada) | 201 | mensaje: Servicio de mano de obra registrado correctamente.; servicios: arreglo con el servicio registrado |
| POST /ordenes/1/recepcion/comprobante | 201 | mensaje: Comprobante de recepción generado correctamente.; comprobante: objeto con datos de recepción y partes relacionadas |


### Administración y recuperación

```http
POST /api/usuarios/recuperar-contrasena HTTP/1.1
Content-Type: application/json

{"email":"demo@example.com"}
```

200: `{"mensaje":"Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."}`. Correo inválido: 400 `{"mensaje":"Ingresa un correo electrónico válido."}`. El envío de correo es asíncrono: 200 no garantiza que SMTP haya entregado el mensaje.

```http
GET /api/usuarios/restablecer-contrasena/<token-del-enlace> HTTP/1.1
```

Token vigente: 200 `{"valido":true}`. Inválido/usado/expirado: 400 `{"valido":false,"mensaje":"El enlace no es válido o ha expirado. Solicita uno nuevo."}`.

```http
POST /api/usuarios/restablecer-contrasena HTTP/1.1
Content-Type: application/json

{"token":"<token-del-enlace>","nuevaContrasena":"NuevaDemo123!","confirmacionContrasena":"NuevaDemo123!"}
```

200: `{"mensaje":"Tu contraseña fue actualizada. Ya puedes iniciar sesión."}`.

```http
PATCH /api/usuarios/3/estado HTTP/1.1
Authorization: Bearer <token-admin>
Content-Type: application/json

{"activo":false}
```

Modificar el propio estado: 403 `{"mensaje":"No puedes modificar el estado de tu propia cuenta desde este panel."}`. GET /api/usuarios?rol=CLIENTE&activo=1 sin coincidencias: 200 `{"success":true,"total":0,"usuarios":[]}`.
