import {
  crearComprobanteRecepcion,
  obtenerComprobanteRecepcion,
  obtenerOrdenParaComprobante,
} from '../models/comprobanteRecepcionModel.js'

function ordenIdDesdeRequest(req) {
  const ordenId = Number(req.params.ordenId)
  return Number.isInteger(ordenId) && ordenId > 0 ? ordenId : null
}

function datosRecepcion(body, orden) {
  const fallaReportada = typeof body.fallaReportada === 'string'
    ? body.fallaReportada.trim()
    : orden.motivoIngreso?.trim() || ''
  const estadoFisico = typeof body.estadoFisico === 'string'
    ? body.estadoFisico.trim()
    : orden.estadoFisico?.trim() || ''
  const accesorios = typeof body.accesorios === 'string'
    ? body.accesorios.trim()
    : orden.accesorios?.trim() || ''
  const observaciones = typeof body.observaciones === 'string'
    ? body.observaciones.trim()
    : orden.observacionesRecepcion?.trim() || ''

  if (!fallaReportada || !estadoFisico || !accesorios) return null
  return { fallaReportada, estadoFisico, accesorios, observaciones }
}

function puedeVer(req, comprobante) {
  return req.user.rol !== 'CLIENTE' || comprobante.cliente.usuarioId === req.user.id
}

export async function consultarOrdenParaComprobante(req, res) {
  const ordenId = ordenIdDesdeRequest(req)
  if (!ordenId) return res.status(400).json({ mensaje: 'El identificador de la orden no es válido.' })
  try {
    const orden = await obtenerOrdenParaComprobante(ordenId)
    if (!orden) return res.status(404).json({ mensaje: 'La orden no existe.' })
    return res.json({ orden })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar los datos de recepción.' })
  }
}

export async function generarComprobante(req, res) {
  const ordenId = ordenIdDesdeRequest(req)
  if (!ordenId) return res.status(400).json({ mensaje: 'El identificador de la orden no es válido.' })
  try {
    const orden = await obtenerOrdenParaComprobante(ordenId)
    if (!orden) return res.status(404).json({ mensaje: 'La orden no existe.' })
    const datos = datosRecepcion(req.body, orden)
    if (!datos) return res.status(400).json({ mensaje: 'Falla reportada, estado físico y accesorios son obligatorios.' })
    const resultado = await crearComprobanteRecepcion({ ordenId, usuarioId: req.user.id, ...datos })
    if (resultado === 'EXISTS') return res.status(409).json({ mensaje: 'La orden ya tiene un comprobante de recepción.' })
    return res.status(201).json({ mensaje: 'Comprobante de recepción generado correctamente.', comprobante: await obtenerComprobanteRecepcion(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible generar el comprobante de recepción.' })
  }
}

export async function consultarComprobante(req, res) {
  const ordenId = ordenIdDesdeRequest(req)
  if (!ordenId) return res.status(400).json({ mensaje: 'El identificador de la orden no es válido.' })
  try {
    const comprobante = await obtenerComprobanteRecepcion(ordenId)
    if (!comprobante) return res.status(404).json({ mensaje: 'La orden todavía no tiene comprobante de recepción.' })
    if (!puedeVer(req, comprobante)) return res.status(403).json({ mensaje: 'No puedes consultar este comprobante.' })
    return res.json({ comprobante })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar el comprobante de recepción.' })
  }
}