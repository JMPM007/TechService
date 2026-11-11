# Estados y reglas de negocio

Fuente: ordenServicioModel.js, diagnosticoModel.js, cotizacionModel.js, manoObraModel.js y sus controladores/rutas.

## Estados de orden

| Estado | Uso operativo |
| --- | --- |
| RECIBIDA | Creación básica o creación junto a diagnóstico |
| PENDIENTE | Creación de orden de servicio completa |
| EN_REVISION | Revisión/diagnóstico |
| EN_REPARACION | Reparación autorizada |
| EN_PROCESO | Trabajo en curso; alternativa existente en el catálogo |
| EN_ESPERA_REPUESTO | Espera de inventario |
| REPARADA | Equipo reparado |
| COMPLETADO | Resultado del endpoint cerrar |
| ENTREGADA | Equipo entregado |
| CANCELADA | Cancelación |

El significado operativo de los nombres no implica una máquina de estados estricta. El código acepta cualquier cambio a un estado del catálogo, salvo repetir el estado actual (409) y entrar a estados que exigen cotización aprobada sin tenerla (409 en /estado).

ADMIN y TECNICO cambian estados y cierran órdenes; CLIENTE no puede hacerlo. No se restringe al técnico asignado. Cada cambio se realiza en transacción y crea historial con usuario, estado anterior/nuevo, observación y fecha. La creación también genera el evento inicial. No sincroniza automáticamente equipos.estado con ordenes_servicio.estado.

**Estados destino que exigen cotización APROBADA:** EN_REPARACION, EN_PROCESO, EN_ESPERA_REPUESTO, REPARADA, COMPLETADO y ENTREGADA. RECIBIDA, PENDIENTE, EN_REVISION y CANCELADA no la requieren.

Un recorrido operativo sugerido es recepción → revisión → diagnóstico → cotización → aprobación del cliente → reparación (con espera de repuesto si aplica) → reparación terminada → cierre/entrega. Ese orden no está impuesto: el backend permite saltos, retrocesos y cambios desde COMPLETADO, ENTREGADA o CANCELADA si se cumplen las comprobaciones anteriores. No documentar esos estados como terminales garantizados.

`PATCH /ordenes/:id/cerrar` llama al mismo cambio con destino COMPLETADO. No exige previamente REPARADA y no bloquea posteriores cambios. Repetir COMPLETADO produce 409. Si falta aprobación, el modelo lanza QUOTE_NOT_APPROVED, pero este controlador no lo convierte en 409 y actualmente responde 500.

## Creación, asignación y diagnóstico

- Solo TECNICO crea órdenes por las rutas actuales, aun si ADMIN tiene otros permisos operativos.
- POST /ordenes crea RECIBIDA; POST /ordenes/servicio crea PENDIENTE; POST /ordenes/diagnostico crea orden y diagnóstico en transacción y parte del valor RECIBIDA del esquema.
- El código de orden se genera como OS-año-ID con al menos cuatro dígitos. El esquema permite varias órdenes para un equipo.
- ADMIN asigna un técnico registrado y no INACTIVO; OCUPADO también es aceptado. El modelo no actualiza automáticamente la disponibilidad ni verifica un límite de carga. La columna fecha_asignacion falta en el esquema actual.
- Crear diagnóstico exige usuario con ficha TECNICO y orden/equipo existente. Hay un solo diagnóstico por orden por UNIQUE. La edición exige rol TECNICO, pero no comprueba asignación ni autoría.

## Cotizaciones y mano de obra

1. A/T puede crear una cotización solo cuando existe orden con diagnóstico. Una por orden; inicia PENDIENTE_APROBACION.
2. A/T puede reemplazar conceptos únicamente mientras está pendiente. Conceptos válidos: SERVICIO, MANO_OBRA, REPUESTO; cantidad positiva, precio no negativo, descripción no vacía.
3. Solo CLIENTE propietario decide APROBADA o RECHAZADA. El modelo comprueba propiedad y estado pendiente bajo transacción; la decisión se registra en historial y no se permite una segunda decisión.
4. Solo ADMIN puede cancelar mediante /cotizacion/estado; esa ruta no sirve para aprobar/rechazar. Permite cancelar una cotización no cancelada incluso si antes fue aprobada/rechazada. Cancelar nuevamente produce 409.
5. La decisión no cambia automáticamente el estado de la orden; una aprobación habilita los destinos indicados arriba.
6. La mano de obra separada puede modificarse sin cotización o con cotización pendiente. Una cotización aprobada, rechazada o cancelada bloquea esas escrituras con 409.
7. Subtotal y total se recalculan con suma de cantidad × precioUnitario de conceptos más servicios_mano_obra, con redondeo a dos decimales. Evitar registrar el mismo trabajo como concepto MANO_OBRA y como servicio separado porque se sumarán ambos. No hay impuesto/descuento calculado actualmente.

## Inventario, recepción y propiedad

- El consumo de repuestos bloquea la fila de inventario, verifica stock y descuenta/asocia en una sola transacción. La cantidad debe ser entera positiva. Stock insuficiente da 409; reabastecer exige cantidad entera positiva.
- Agregar repuestos a una orden no comprueba cotización aprobada ni actualiza automáticamente conceptos de cotización.
- Solo un comprobante por orden; exige falla, estado físico y accesorios, explícitos o recuperados de orden/equipo. A/T lo genera, C solo consulta si es propietario.
- El seguimiento por código limita al cliente propietario; no usa conocer el código como autorización. Historial de equipo, cotización y comprobante también comprueban propiedad.
- Excepción actual: GET /equipos/cliente/:clienteId admite CLIENTE sin verificación de propiedad. No asumir aislamiento total por rol.

## Administración de usuarios y eliminación de clientes

ADMIN lista, consulta y edita usuarios; no puede editar su propio rol ni estado desde administración. No se puede degradar o desactivar al último ADMIN activo. Repetir estado activo/inactivo produce 409. Cambios de rol y estado se aplican en cada solicitud protegida porque el middleware consulta MySQL.

ADMIN puede eliminar la ficha de cliente solo si no tiene equipos registrados. Se comprueba y elimina en transacción con bloqueo; tener equipos produce 409 y evita la cascada. Eliminar la ficha no elimina automáticamente su cuenta.

Recuperación: token aleatorio de 32 bytes, hash SHA-256 en base, un solo uso, TTL por defecto 30 minutos. Otro token invalida los anteriores; máximo tres solicitudes registradas por usuario en quince minutos. Respuesta uniforme para correo inexistente, cuenta inactiva o límite alcanzado. La recuperación no revoca JWT existentes.
