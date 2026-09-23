import pool from '../config/db.js'
import {
  PRIORIDADES,
  TIPOS_SERVICIO,
  crearOrdenServicio,
  asignarTecnicoAOrden,
  listarOrdenesServicio,
  obtenerOrdenServicio,
} from '../models/ordenServicioHuModel.js'

export async function registrarOrdenServicio(req, res) {
  const equipoId = Number(req.body.equipoId)
  const motivoIngreso = typeof req.body.motivoIngreso === 'string' ? req.body.motivoIngreso.trim() : ''
  const tipoServicio = typeof req.body.tipoServicio === 'string' ? req.body.tipoServicio.trim() : ''
  const prioridad = req.body.prioridad || 'MEDIA'
  const costoEstimado = Number(req.body.costoEstimado || 0)
  const abonoInicial = Number(req.body.abonoInicial || 0)

  if (!Number.isInteger(equipoId) || equipoId <= 0 || !motivoIngreso || !TIPOS_SERVICIO.includes(tipoServicio) || !PRIORIDADES.includes(prioridad) || !Number.isFinite(costoEstimado) || costoEstimado < 0 || !Number.isFinite(abonoInicial) || abonoInicial < 0) {
    return res.status(400).json({ mensaje: 'Los datos de la orden son inválidos o incompletos.' })
  }

  try {
    const [equipos] = await pool.query('SELECT id FROM equipos WHERE id = ?', [equipoId])
    if (!equipos.length) return res.status(404).json({ mensaje: 'El equipo no existe.' })
    const orden = await crearOrdenServicio({ equipoId, tecnicoId: req.body.tecnicoId, usuarioId: req.user.id, motivoIngreso, tipoServicio, prioridad, costoEstimado, abonoInicial, observacionesRecepcion: req.body.observacionesRecepcion })
    return res.status(201).json({ success: true, mensaje: `La orden ${orden.codigo_orden} fue creada correctamente.`, codigoOrden: orden.codigo_orden, orden })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible crear la orden de servicio.' })
  }
}

export async function consultarOrdenesServicio(req, res) {
  try {
    const ordenes = await listarOrdenesServicio({ search: req.query.search, estado: req.query.estado })
    return res.json({ success: true, total: ordenes.length, ordenes })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar las órdenes.' })
  }
}

export async function consultarOrdenServicio(req, res) {
  const ordenId = Number(req.params.ordenId)
  if (!Number.isInteger(ordenId) || ordenId <= 0) return res.status(400).json({ mensaje: 'El identificador de la orden no es válido.' })
  try {
    const orden = await obtenerOrdenServicio(ordenId)
    if (!orden) return res.status(404).json({ mensaje: 'La orden no existe.' })
    return res.json({ success: true, orden })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar la orden.' })
  }
}

export async function asignarOrdenATecnico(req, res) {
  const ordenId = Number(req.params.ordenId)
  const tecnicoId = Number(req.body.tecnicoId)

  if (!Number.isInteger(ordenId) || ordenId <= 0 || !Number.isInteger(tecnicoId) || tecnicoId <= 0) {
    return res.status(400).json({ mensaje: 'La orden y el técnico son obligatorios.' })
  }

  try {
    const result = await asignarTecnicoAOrden(ordenId, tecnicoId)
    if (result === 'ORDER_NOT_FOUND') return res.status(404).json({ mensaje: 'La orden no existe.' })
    if (result === 'TECHNICIAN_NOT_FOUND') return res.status(404).json({ mensaje: 'El técnico no existe.' })
    if (result === 'TECHNICIAN_INACTIVE') return res.status(409).json({ mensaje: 'No se puede asignar un técnico inactivo.' })
    return res.json({ mensaje: 'Orden asignada correctamente.', orden: await obtenerOrdenServicio(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible asignar la orden.' })
  }
}