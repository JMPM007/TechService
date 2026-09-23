import {
  ESTADOS_ORDEN,
  cambiarEstadoOrden,
  crearOrden,
  obtenerHistorialOrden,
  obtenerOrden,
  obtenerOrdenPorReferencia,
} from '../models/ordenModel.js'
import {
  actualizarDiagnostico as actualizarDiagnosticoDb,
  buscarTecnicoPorUsuario,
  crearDiagnostico,
  crearOrdenYDiagnostico,
  existeOrden,
  obtenerDiagnostico,
} from '../models/diagnosticoModel.js'
import pool from '../config/db.js'

function validarDatosDiagnostico(body) {
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : ''
  const fallaEncontrada = typeof body.fallaEncontrada === 'string'
    ? body.fallaEncontrada.trim()
    : ''
  const fechaDiagnostico = typeof body.fechaDiagnostico === 'string'
    ? body.fechaDiagnostico.trim()
    : ''

  if (!descripcion || !fallaEncontrada || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(fechaDiagnostico)) {
    return null
  }

  return {
    descripcion,
    fallaEncontrada,
    fechaDiagnostico,
    recomendaciones: typeof body.recomendaciones === 'string' ? body.recomendaciones.trim() : '',
    procedimientos: typeof body.procedimientos === 'string' ? body.procedimientos.trim() : '',
    observaciones: typeof body.observaciones === 'string' ? body.observaciones.trim() : '',
  }
}

export async function registrarOrden(req, res) {
  const { equipoId, observacion } = req.body
  const equipoIdNumero = Number(equipoId)

  if (!Number.isInteger(equipoIdNumero) || equipoIdNumero <= 0) {
    return res.status(400).json({ mensaje: 'equipoId debe ser un número válido.' })
  }

  try {
    const [equipos] = await pool.query('SELECT id FROM equipos WHERE id = ?', [equipoIdNumero])
    if (!equipos.length) return res.status(404).json({ mensaje: 'El equipo no existe.' })

    const id = await crearOrden({ equipoId: equipoIdNumero, usuarioId: req.user.id, observacion })
    return res.status(201).json({ mensaje: 'Orden registrada correctamente.', orden: await obtenerOrden(id) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'El equipo ya tiene una orden de servicio.' })
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible registrar la orden.' })
  }
}

export async function actualizarEstadoOrden(req, res) {
  const ordenId = Number(req.params.ordenId)
  const { estado, observacion } = req.body

  if (!Number.isInteger(ordenId) || ordenId <= 0 || !ESTADOS_ORDEN.includes(estado)) {
    return res.status(400).json({ mensaje: 'La orden o el estado no son válidos.' })
  }

  try {
    const cambio = await cambiarEstadoOrden({
      ordenId,
      estadoNuevo: estado,
      usuarioId: req.user.id,
      observacion,
    })
    if (!cambio) return res.status(404).json({ mensaje: 'La orden no existe.' })
    return res.json({ mensaje: 'Estado actualizado correctamente.', orden: await obtenerOrden(ordenId) })
  } catch (error) {
    if (error.code === 'SAME_STATUS') return res.status(409).json({ mensaje: error.message })
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible actualizar el estado.' })
  }
}

export async function consultarHistorialOrden(req, res) {
  const referencia = req.params.ordenId?.trim()
  if (!referencia) {
    return res.status(400).json({ mensaje: 'Ingresa el ID o código de la orden.' })
  }

  try {
    const orden = await obtenerOrdenPorReferencia(referencia)
    if (!orden) return res.status(404).json({ mensaje: 'La orden no existe.' })
    return res.json({ ordenId: orden.id, historial: await obtenerHistorialOrden(orden.id) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar el historial.' })
  }
}

export async function registrarDiagnostico(req, res) {
  const ordenId = Number(req.params.ordenId)
  const datos = validarDatosDiagnostico(req.body)

  if (!Number.isInteger(ordenId) || ordenId <= 0 || !datos) {
    return res.status(400).json({
      mensaje: 'Descripción, falla encontrada y una fecha válida son obligatorias.',
    })
  }

  try {
    if (!await existeOrden(ordenId)) return res.status(404).json({ mensaje: 'La orden no existe.' })

    const tecnico = await buscarTecnicoPorUsuario(req.user.id)
    if (!tecnico) return res.status(403).json({ mensaje: 'Solo un técnico registrado puede crear diagnósticos.' })

    const id = await crearDiagnostico({ ordenId, tecnicoId: tecnico.id, ...datos })
    return res.status(201).json({ mensaje: 'Diagnóstico registrado correctamente.', diagnostico: await obtenerDiagnostico(ordenId), id })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'La orden ya tiene un diagnóstico registrado.' })
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible registrar el diagnóstico.' })
  }
}

export async function registrarNuevoDiagnostico(req, res) {
  const equipoId = Number(req.body.equipoId)
  const datos = validarDatosDiagnostico(req.body)

  if (!Number.isInteger(equipoId) || equipoId <= 0 || !datos) {
    return res.status(400).json({
      mensaje: 'equipoId, descripción, falla encontrada y una fecha válida son obligatorios.',
    })
  }

  try {
    const tecnico = await buscarTecnicoPorUsuario(req.user.id)
    if (!tecnico) return res.status(403).json({ mensaje: 'Solo un técnico registrado puede crear diagnósticos.' })

    const [equipos] = await pool.query('SELECT id FROM equipos WHERE id = ?', [equipoId])
    if (!equipos.length) return res.status(404).json({ mensaje: 'El equipo no existe.' })

    const resultado = await crearOrdenYDiagnostico({ equipoId, tecnicoId: tecnico.id, ...datos })
    return res.status(201).json({
      mensaje: 'Diagnóstico registrado y orden creada correctamente.',
      ordenId: resultado.ordenId,
      diagnosticoId: resultado.diagnosticoId,
      diagnostico: await obtenerDiagnostico(resultado.ordenId),
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El equipo ya tiene una orden de servicio. Consulta esa orden para registrar o editar su diagnóstico.' })
    }
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible crear la orden y el diagnóstico.' })
  }
}

export async function actualizarDiagnostico(req, res) {
  const ordenId = Number(req.params.ordenId)
  const datos = validarDatosDiagnostico(req.body)

  if (!Number.isInteger(ordenId) || ordenId <= 0 || !datos) {
    return res.status(400).json({
      mensaje: 'Descripción, falla encontrada y una fecha válida son obligatorias.',
    })
  }

  try {
    if (!await existeOrden(ordenId)) return res.status(404).json({ mensaje: 'La orden no existe.' })
    if (!await obtenerDiagnostico(ordenId)) return res.status(404).json({ mensaje: 'La orden todavía no tiene diagnóstico.' })

    await actualizarDiagnosticoDb(ordenId, datos)
    return res.json({ mensaje: 'Diagnóstico actualizado correctamente.', diagnostico: await obtenerDiagnostico(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible actualizar el diagnóstico.' })
  }
}

export async function consultarDiagnostico(req, res) {
  const ordenId = Number(req.params.ordenId)
  if (!Number.isInteger(ordenId) || ordenId <= 0) {
    return res.status(400).json({ mensaje: 'El identificador de la orden no es válido.' })
  }

  try {
    const diagnostico = await obtenerDiagnostico(ordenId)
    if (!diagnostico) return res.status(404).json({ mensaje: 'La orden no tiene diagnóstico registrado.' })
    return res.json({ diagnostico })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar el diagnóstico.' })
  }
}
