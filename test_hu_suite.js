// Script de verificación automatizada de HU-13, HU-14 y HU-15

async function runTestSuite() {
  const BASE_URL = 'http://localhost:3000/api'
  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${message}`)
      failed++
    }
  }

  console.log('\n======================================================')
  console.log('🧪 INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS HU-13, 14, 15')
  console.log('======================================================\n')

  // -----------------------------------------------------------
  // HU-13: Consultar ficha técnica y propiedades del equipo
  // -----------------------------------------------------------
  console.log('📋 HU-13: Consultar ficha técnica y propiedades del equipo')
  
  // Criterio 1: Búsqueda y listado
  const resList = await fetch(`${BASE_URL}/equipos`)
  const dataList = await resList.json()
  assert(resList.status === 200 && dataList.success && dataList.equipos.length >= 3, 
    'Criterio 1: Se permite listar y consultar equipos previamente registrados')

  const resSearch = await fetch(`${BASE_URL}/equipos?search=SN-LEN-88231`)
  const dataSearch = await resSearch.json()
  assert(dataSearch.equipos.length === 1 && dataSearch.equipos[0].numero_serie === 'SN-LEN-88231',
    'Criterio 1: Se permite buscar equipo por número de serie registrado')

  // Criterios 2 y 3: Mostrar ficha técnica correspondiente con características técnicas
  const resFicha = await fetch(`${BASE_URL}/equipos/1`)
  const dataFicha = await resFicha.json()
  assert(resFicha.status === 200 && dataFicha.equipo && dataFicha.equipo.marca === 'Lenovo',
    'Criterio 2: El sistema muestra la ficha técnica correspondiente al equipo')
  
  const eq = dataFicha.equipo
  assert(
    eq.procesador && eq.memoria_ram && eq.almacenamiento && eq.tarjeta_grafica && eq.sistema_operativo && eq.estado_fisico,
    'Criterio 3: La ficha muestra todas las características y propiedades técnicas (procesador, RAM, almacenamiento, GPU, SO, estado físico)'
  )

  // Criterio 5: Informar al usuario cuando el equipo consultado no exista o no esté registrado
  const resNotFound = await fetch(`${BASE_URL}/equipos/99999`)
  const dataNotFound = await resNotFound.json()
  assert(resNotFound.status === 404 && dataNotFound.success === false && dataNotFound.error.includes('no existe o no se encuentra registrado'),
    'Criterio 5: El sistema informa claramente con error 404 cuando el equipo consultado no existe o no se encuentra registrado')

  const resNotFoundSerie = await fetch(`${BASE_URL}/equipos/serie/SERIE-FALSA-123`)
  const dataNotFoundSerie = await resNotFoundSerie.json()
  assert(resNotFoundSerie.status === 404 && dataNotFoundSerie.error.includes('no existe'),
    'Criterio 5: El sistema informa cuando un número de serie no existe')

  // Criterio 6: La consulta no debe modificar la información registrada
  const resFichaBefore = await fetch(`${BASE_URL}/equipos/1`)
  const dBefore = await resFichaBefore.json()
  const resFichaAfter = await fetch(`${BASE_URL}/equipos/1`)
  const dAfter = await resFichaAfter.json()
  assert(dBefore.equipo.actualizado_en === dAfter.equipo.actualizado_en && dBefore.equipo.procesador === dAfter.equipo.procesador,
    'Criterio 6: La consulta de la ficha técnica es de solo lectura y no modifica los datos')

  // -----------------------------------------------------------
  // HU-14: Editar características de un equipo
  // -----------------------------------------------------------
  console.log('\n✏️ HU-14: Editar características de un equipo')

  // Criterio 4: Impedir guardar cuando campos obligatorios estén vacíos o inválidos
  const resBadEdit = await fetch(`${BASE_URL}/equipos/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo_equipo: '', // Vacío
      marca: '',       // Vacío
      modelo: 'ThinkPad T14 Gen 2',
      numero_serie: 'SN-LEN-88231'
    })
  })
  const dataBadEdit = await resBadEdit.json()
  assert(resBadEdit.status === 400 && dataBadEdit.success === false && dataBadEdit.detalles.length > 0,
    'Criterio 4: El sistema impide guardar cambios con campos obligatorios vacíos (tipo_equipo, marca)')

  // Criterio 6 y 7: Actualizar información cuando datos son válidos y mostrar mensaje de confirmación
  const originalRam = eq.memoria_ram
  const newRam = originalRam === '32 GB DDR4' ? '16 GB DDR4' : '32 GB DDR4'
  const newEstado = 'Excelente estado general, mantenimiento térmico realizado.'

  const resEditOk = await fetch(`${BASE_URL}/equipos/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo_equipo: eq.tipo_equipo,
      marca: eq.marca,
      modelo: eq.modelo,
      numero_serie: eq.numero_serie,
      procesador: eq.procesador,
      memoria_ram: newRam,
      almacenamiento: eq.almacenamiento,
      tarjeta_grafica: eq.tarjeta_grafica,
      sistema_operativo: eq.sistema_operativo,
      estado_fisico: newEstado,
      accesorios: eq.accesorios,
      observaciones: 'Actualización técnica verificada satisfactoriamente.'
    })
  })
  const dataEditOk = await resEditOk.json()
  assert(resEditOk.status === 200 && dataEditOk.success === true,
    'Criterio 6: El sistema actualiza la información del equipo cuando los datos ingresados son válidos')
  assert(dataEditOk.mensaje.includes('actualizadas correctamente'),
    'Criterio 7: El sistema muestra mensaje confirmando que las características fueron actualizadas correctamente')

  // Criterio 8: Los cambios se mantienen disponibles al volver a consultar
  const resCheckPersist = await fetch(`${BASE_URL}/equipos/1`)
  const dataCheckPersist = await resCheckPersist.json()
  assert(dataCheckPersist.equipo.memoria_ram === newRam && dataCheckPersist.equipo.estado_fisico === newEstado,
    'Criterio 8: Los cambios persisten y se mantienen disponibles al volver a consultar la ficha técnica')

  // -----------------------------------------------------------
  // HU-15: Crear orden de servicio
  // -----------------------------------------------------------
  console.log('\n📝 HU-15: Crear orden de servicio')

  // Criterio 5: Impedir creación cuando faltan campos obligatorios
  const resBadOrder = await fetch(`${BASE_URL}/ordenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      equipo_id: null,
      motivo_ingreso: '',
      tipo_servicio: ''
    })
  })
  const dataBadOrder = await resBadOrder.json()
  assert(resBadOrder.status === 400 && dataBadOrder.success === false && dataBadOrder.detalles.length >= 3,
    'Criterio 5: El sistema impide la creación de orden cuando los campos obligatorios están vacíos')

  // Criterios 1, 2, 4, 6, 7 y 8: Crear orden válida asociada al equipo
  const resOrderOk = await fetch(`${BASE_URL}/ordenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      equipo_id: 1,
      tecnico_id: 2,
      motivo_ingreso: 'Equipo presenta reinicios aleatorios al exigir carga de trabajo.',
      tipo_servicio: 'Diagnóstico Técnico',
      prioridad: 'ALTA',
      costo_estimado: 95000.00,
      abono_inicial: 30000.00,
      observaciones_recepcion: 'Se recibe con cargador original.'
    })
  })
  const dataOrderOk = await resOrderOk.json()
  assert(resOrderOk.status === 201 && dataOrderOk.success === true,
    'Criterio 1 y 4: Se registra la orden de servicio con la información requerida')
  assert(dataOrderOk.codigo_orden && /^OS-\d{4}-\d{4}$/.test(dataOrderOk.codigo_orden),
    `Criterio 6: El sistema genera un identificador único correlativo (${dataOrderOk.codigo_orden})`)
  assert(dataOrderOk.orden.equipo_id === 1 && dataOrderOk.orden.equipo_serie === 'SN-LEN-88231',
    'Criterio 7: El sistema registra la orden de servicio asociada al equipo seleccionado')
  assert(dataOrderOk.mensaje.includes('creada correctamente') && dataOrderOk.mensaje.includes(dataOrderOk.codigo_orden),
    'Criterio 8: El sistema muestra mensaje confirmando que la orden de servicio fue creada correctamente')

  // Criterio 9: La orden creada queda disponible para su posterior consulta y gestión
  const resListOrders = await fetch(`${BASE_URL}/ordenes`)
  const dataListOrders = await resListOrders.json()
  const foundNewOrder = dataListOrders.ordenes.find(o => o.codigo_orden === dataOrderOk.codigo_orden)
  assert(foundNewOrder !== undefined && foundNewOrder.motivo_ingreso.includes('reinicios aleatorios'),
    'Criterio 9: La orden de servicio creada queda disponible para su posterior consulta y gestión en el sistema')

  // Obtener detalle individual de la orden
  const resOrderDetail = await fetch(`${BASE_URL}/ordenes/${dataOrderOk.orden.id}`)
  const dataOrderDetail = await resOrderDetail.json()
  assert(dataOrderDetail.success && dataOrderDetail.orden.codigo_orden === dataOrderOk.codigo_orden,
    'Criterio 9: Se puede consultar el detalle completo de la orden creada con datos de cliente y equipo')

  console.log('\n======================================================')
  console.log(`🏁 RESULTADOS: ${passed} PASARON, ${failed} FALLARON`)
  console.log('======================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite().catch(err => {
  console.error('Error durante la ejecución del test suite:', err)
  process.exit(1)
})
