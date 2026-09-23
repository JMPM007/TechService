import {
  ESTADOS_COTIZACION,
  TIPOS_CONCEPTO,
  actualizarConceptosCotizacion,
  actualizarEstadoCotizacion,
  crearCotizacion,
  obtenerContextoOrden,
  obtenerCotizacion,
} from '../models/cotizacionModel.js'

function normalizarConceptos(conceptos) {
  if (!Array.isArray(conceptos) || conceptos.length === 0) return null

  const normalizados = conceptos.map((concepto) => {
    const cantidad = Number(concepto.cantidad)
    const precioUnitario = Number(concepto.precioUnitario)
    const descripcion = typeof concepto.descripcion === 'string'
      ? concepto.descripcion.trim()
      : ''

    if (!TIPOS_CONCEPTO.includes(concepto.tipo)
      || !descripcion
      || !Number.isFinite(cantidad)
      || cantidad <= 0
      || !Number.isFinite(precioUnitario)
      || precioUnitario < 0) {
      return null
    }

    return {
      tipo: concepto.tipo,
      descripcion,
      cantidad,
      precioUnitario,
      observaciones: typeof concepto.observaciones === 'string'
        ? concepto.observaciones.trim()
        : '',
    }
  })

  if (normalizados.some((concepto) => !concepto)) return null

  const subtotal = normalizados.reduce(
    (total, concepto) => total + concepto.cantidad * concepto.precioUnitario,
    0,
  )
  const roundedSubtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100

  return { conceptos: normalizados, subtotal: roundedSubtotal, total: roundedSubtotal }
}

function ordenIdDesdeRequest(req) {
  const ordenId = Number(req.params.ordenId)
  return Number.isInteger(ordenId) && ordenId > 0 ? ordenId : null
}

async function puedeConsultar(req, cotizacion) {
  if (req.user.rol !== 'CLIENTE') return true
  const contexto = await obtenerContextoOrden(cotizacion.ordenId)
  return contexto?.clienteUsuarioId === req.user.id
}

export async function registrarCotizacion(req, res) {
  const ordenId = ordenIdDesdeRequest(req)
  const datos = normalizarConceptos(req.body.conceptos)
  if (!ordenId || !datos) {
    return res.status(400).json({ mensaje: 'La orden y al menos un concepto válido son obligatorios.' })
  }

  try {
    const contexto = await obtenerContextoOrden(ordenId)
    if (!contexto) {
      return res.status(400).json({ mensaje: 'La orden debe existir y tener un diagnóstico registrado.' })
    }
    if (await obtenerCotizacion(ordenId)) {
      return res.status(409).json({ mensaje: 'La orden ya tiene una cotización registrada.' })
    }

    const id = await crearCotizacion({ ordenId, usuarioId: req.user.id, ...datos })
    return res.status(201).json({
      mensaje: 'Cotización registrada correctamente.',
      cotizacion: await obtenerCotizacion(ordenId),
      id,
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'La orden ya tiene una cotización registrada.' })
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible registrar la cotización.' })
  }
}

export async function consultarCotizacion(req, res) {
  const ordenId = ordenIdDesdeRequest(req)
  if (!ordenId) return res.status(400).json({ mensaje: 'El identificador de la orden no es válido.' })

  try {
    const cotizacion = await obtenerCotizacion(ordenId)
    if (!cotizacion) return res.status(404).json({ mensaje: 'La orden no tiene cotización registrada.' })
    if (!await puedeConsultar(req, cotizacion)) return res.status(403).json({ mensaje: 'No puedes consultar esta cotización.' })
    return res.json({ cotizacion })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar la cotización.' })
  }
}

export async function editarConceptosCotizacion(req, res) {
  const ordenId = ordenIdDesdeRequest(req)
  const datos = normalizarConceptos(req.body.conceptos)
  if (!ordenId || !datos) return res.status(400).json({ mensaje: 'La orden y los conceptos válidos son obligatorios.' })

  try {
    const resultado = await actualizarConceptosCotizacion({ ordenId, ...datos })
    if (resultado === 'NOT_FOUND') return res.status(404).json({ mensaje: 'La orden no tiene cotización registrada.' })
    if (resultado === 'LOCKED') return res.status(409).json({ mensaje: 'Solo se puede editar una cotización pendiente de aprobación.' })
    return res.json({ mensaje: 'Conceptos actualizados correctamente.', cotizacion: await obtenerCotizacion(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible actualizar los conceptos.' })
  }
}

export async function cambiarEstadoCotizacion(req, res) {
  const ordenId = ordenIdDesdeRequest(req)
  const { estado } = req.body
  if (!ordenId || !ESTADOS_COTIZACION.includes(estado)) {
    return res.status(400).json({ mensaje: 'La orden o el estado de cotización no son válidos.' })
  }

  try {
    const cotizacion = await obtenerCotizacion(ordenId)
    if (!cotizacion) return res.status(404).json({ mensaje: 'La orden no tiene cotización registrada.' })
    if (cotizacion.estado === 'CANCELADA') return res.status(409).json({ mensaje: 'Una cotización cancelada no puede cambiar de estado.' })
    await actualizarEstadoCotizacion(ordenId, estado)
    return res.json({ mensaje: 'Estado de cotización actualizado correctamente.', cotizacion: await obtenerCotizacion(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible actualizar el estado de la cotización.' })
  }
}
