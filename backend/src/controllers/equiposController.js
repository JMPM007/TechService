import pool from '../config/db.js'
import { buscarClientePorCedulaOEmail } from '../models/clienteModel.js'
import {
  actualizarEquipo,
  buscarEquipoPorSerial,
  crearEquipo,
  listarEquipos,
  obtenerEquipoPorId,
  obtenerEquipoPorMarcaYSerial,
  obtenerEquiposPorCliente,
} from '../models/equiposModel.js'

export async function registrarEquipo(req, res) {
  try {
    const { cedula, tipo, marca, modelo, numero_serie } = req.body
    let clienteId

    if (!clienteId && cedula) {
      const cliente = await buscarClientePorCedulaOEmail(cedula, '')
      if (!cliente) return res.status(404).json({ error: 'No se encontró ningún cliente con la cédula ingresada' })
      clienteId = cliente.id
    }
    if (!clienteId) return res.status(400).json({ error: 'La cédula del cliente es obligatoria' })
    if (!tipo || !modelo || !marca || !numero_serie) return res.status(400).json({ error: 'Tipo, marca, modelo y número de serie son obligatorios' })

    let clienteLookup = clienteId
    if (!clienteLookup && cedula) {
      const cliente = await buscarClientePorCedulaOEmail(cedula.trim(), '')
      clienteLookup = cliente?.id
    }
    const [rows] = await pool.query('SELECT id FROM clientes WHERE id = ? LIMIT 1', [clienteLookup])
    if (!rows.length) return res.status(404).json({ error: 'El cliente no existe en el sistema' })

    const id = await crearEquipo({ cliente_id: clienteLookup, tipo: tipo.trim(), marca: marca.trim(), modelo: modelo.trim(), numero_serie: numero_serie.trim(), motivo_ingreso: null })
    return res.status(201).json({ mensaje: 'Equipo registrado exitosamente', equipo: { id, cliente_id: clienteLookup, tipo, marca, modelo, numero_serie } })
  } catch (error) {
    console.error(error)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El número de serie ya está registrado para otro equipo.' })
    }
    return res.status(500).json({ error: 'No fue posible registrar el equipo' })
  }
}

export async function obtenerEquiposCliente(req, res) {
  try {
    return res.json(await obtenerEquiposPorCliente(req.params.clienteId))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible obtener los equipos' })
  }
}

export async function obtenerEquipo(req, res) {
  const equipoId = Number(req.params.equipoId)
  if (!Number.isInteger(equipoId) || equipoId <= 0) {
    return res.status(400).json({ mensaje: 'El identificador del equipo no es válido.' })
  }

  try {
    const equipo = await obtenerEquipoPorId(equipoId)
    if (!equipo) return res.status(404).json({ mensaje: 'El equipo no existe.' })
    return res.json({ equipo })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible consultar el equipo.' })
  }
}

export async function buscarEquipoPorMarcaYSerial(req, res) {
  const marca = typeof req.query.marca === 'string' ? req.query.marca.trim() : ''
  const numeroSerie = typeof req.query.numeroSerie === 'string' ? req.query.numeroSerie.trim() : ''

  if (!marca || !numeroSerie) {
    return res.status(400).json({ mensaje: 'La marca y el número serial son obligatorios.' })
  }

  try {
    const equipo = await obtenerEquipoPorMarcaYSerial(marca, numeroSerie)
    if (!equipo) return res.status(404).json({ mensaje: 'No se encontró un equipo con esa marca y serial.' })
    return res.json({ equipo })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible buscar el equipo.' })
  }
}

export async function listarFichaEquipos(req, res) {
  try {
    const equipos = await listarEquipos({ search: req.query.search })
    return res.json({ success: true, total: equipos.length, equipos })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, mensaje: 'No fue posible consultar los equipos.' })
  }
}

export async function buscarEquipoPorSerialExacto(req, res) {
  const numeroSerie = req.params.serie?.trim()
  if (!numeroSerie) return res.status(400).json({ mensaje: 'El número de serie es obligatorio.' })

  try {
    const equipo = await buscarEquipoPorSerial(numeroSerie)
    if (!equipo) return res.status(404).json({ mensaje: 'El equipo no existe.' })
    return res.json({ success: true, equipo })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible buscar el equipo.' })
  }
}

export async function editarFichaEquipo(req, res) {
  const equipoId = Number(req.params.equipoId)
  const datos = req.body
  const required = ['tipo', 'marca', 'modelo', 'numeroSerie']
  if (!Number.isInteger(equipoId) || equipoId <= 0 || required.some((field) => !String(datos[field] ?? '').trim())) {
    return res.status(400).json({ mensaje: 'Tipo, marca, modelo y número de serie son obligatorios.' })
  }

  try {
    const actual = await obtenerEquipoPorId(equipoId)
    if (!actual) return res.status(404).json({ mensaje: 'El equipo no existe.' })
    const serial = await buscarEquipoPorSerial(datos.numeroSerie)
    if (serial && serial.id !== equipoId) return res.status(409).json({ mensaje: 'El número de serie ya pertenece a otro equipo.' })

    const equipo = await actualizarEquipo(equipoId, {
      tipo: datos.tipo.trim(), marca: datos.marca.trim(), modelo: datos.modelo.trim(), numeroSerie: datos.numeroSerie.trim(),
      procesador: datos.procesador?.trim(), memoriaRam: datos.memoriaRam?.trim(), almacenamiento: datos.almacenamiento?.trim(),
      tarjetaGrafica: datos.tarjetaGrafica?.trim(), sistemaOperativo: datos.sistemaOperativo?.trim(), estadoFisico: datos.estadoFisico?.trim(),
      accesorios: datos.accesorios?.trim(), observaciones: datos.observaciones?.trim(),
    })
    return res.json({ success: true, mensaje: 'Ficha técnica actualizada correctamente.', equipo })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible actualizar la ficha técnica.' })
  }
}
