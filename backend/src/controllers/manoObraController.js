import {
  actualizarServicioManoObra,
  crearServicioManoObra,
  eliminarServicioManoObra,
  obtenerServiciosManoObra,
} from '../models/manoObraModel.js'

function obtenerOrdenId(req) {
  const ordenId = Number(req.params.ordenId)
  return Number.isInteger(ordenId) && ordenId > 0 ? ordenId : null
}

function obtenerServicioId(req) {
  const servicioId = Number(req.params.servicioId)
  return Number.isInteger(servicioId) && servicioId > 0 ? servicioId : null
}

function validarDatos(body) {
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : ''
  const costo = Number(body.costo)
  const tiempoMinutos = body.tiempoMinutos === undefined || body.tiempoMinutos === null || body.tiempoMinutos === ''
    ? null
    : Number(body.tiempoMinutos)

  if (!descripcion || !Number.isFinite(costo) || costo < 0 ||
    (tiempoMinutos !== null && (!Number.isInteger(tiempoMinutos) || tiempoMinutos <= 0))) {
    return null
  }
  return { descripcion, costo, tiempoMinutos }
}

function responderResultado(res, resultado) {
  if (resultado === 'NOT_FOUND') return res.status(404).json({ mensaje: 'La orden no existe.' })
  if (resultado === 'SERVICE_NOT_FOUND') return res.status(404).json({ mensaje: 'El servicio de mano de obra no existe para esta orden.' })
  if (resultado === 'LOCKED') return res.status(409).json({ mensaje: 'La cotización no permite modificar servicios de mano de obra en su estado actual.' })
  return null
}

export async function listarManoObra(req, res) {
  const ordenId = obtenerOrdenId(req)
  if (!ordenId) return res.status(400).json({ mensaje: 'El identificador de la orden no es válido.' })
  try {
    return res.json({ servicios: await obtenerServiciosManoObra(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar los servicios de mano de obra.' })
  }
}

export async function registrarManoObra(req, res) {
  const ordenId = obtenerOrdenId(req)
  const datos = validarDatos(req.body)
  if (!ordenId || !datos) return res.status(400).json({ mensaje: 'Descripción y costo válido son obligatorios; el tiempo debe ser un entero positivo.' })
  try {
    const resultado = await crearServicioManoObra({ ordenId, usuarioId: req.user.id, ...datos })
    const errorResponse = responderResultado(res, resultado)
    if (errorResponse) return errorResponse
    return res.status(201).json({ mensaje: 'Servicio de mano de obra registrado correctamente.', servicios: await obtenerServiciosManoObra(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible registrar el servicio de mano de obra.' })
  }
}

export async function editarManoObra(req, res) {
  const ordenId = obtenerOrdenId(req)
  const servicioId = obtenerServicioId(req)
  const datos = validarDatos(req.body)
  if (!ordenId || !servicioId || !datos) return res.status(400).json({ mensaje: 'Los datos del servicio de mano de obra no son válidos.' })
  try {
    const resultado = await actualizarServicioManoObra({ ordenId, servicioId, ...datos })
    const errorResponse = responderResultado(res, resultado)
    if (errorResponse) return errorResponse
    return res.json({ mensaje: 'Servicio de mano de obra actualizado correctamente.', servicios: await obtenerServiciosManoObra(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible actualizar el servicio de mano de obra.' })
  }
}

export async function borrarManoObra(req, res) {
  const ordenId = obtenerOrdenId(req)
  const servicioId = obtenerServicioId(req)
  if (!ordenId || !servicioId) return res.status(400).json({ mensaje: 'Los identificadores de la orden y del servicio no son válidos.' })
  try {
    const resultado = await eliminarServicioManoObra(ordenId, servicioId)
    const errorResponse = responderResultado(res, resultado)
    if (errorResponse) return errorResponse
    return res.json({ mensaje: 'Servicio de mano de obra eliminado correctamente.', servicios: await obtenerServiciosManoObra(ordenId) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible eliminar el servicio de mano de obra.' })
  }
}