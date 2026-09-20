import { crearEquipoBD, obtenerEquiposPorClienteBD } from "../models/equiposModel.js"
import { buscarClientePorCedulaOEmail } from "../models/clienteModel.js"
import pool from "../config/db.js"

export async function registrarEquipo(req, res) {
  try {
    const { cliente_id, cedula, tipo, marca, modelo, numero_serie, motivo_ingreso } = req.body

    let targetClienteId = cliente_id

    if (!targetClienteId && cedula) {
      const cliente = await buscarClientePorCedulaOEmail(cedula, null)
      if (!cliente) {
        return res.status(404).json({ error: "No se encontró ningún cliente con la cédula ingresada" })
      }
      targetClienteId = cliente.id
    }else if (targetClienteId) {
      const [rows] = await pool.query("SELECT id FROM clientes WHERE id = ? LIMIT 1", [targetClienteId])
      if (rows.length === 0) {
        return res.status(404).json({ error: "El ID del cliente proporcionado no existe en el sistema." })
      }
    } else {
      return res.status(400).json({ error: "Es obligatorio asociar un cliente mediante cliente_id o cedula." })
    }

    if (!targetClienteId || !tipo || !modelo || !motivo_ingreso) {
      return res.status(400).json({
        error: "Los campos cliente, tipo, modelo y motivo de ingreso inicial son obligatorios"
      })
    }

    const equipoId = await crearEquipoBD({
      cliente_id: targetClienteId,
      tipo: tipo.trim(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      numero_serie: numero_serie ? numero_serie.trim() : null,
      motivo_ingreso: motivo_ingreso.trim()
    })

    return res.status(201).json({
      mensaje: "Equipo registrado exitosamente en recepción",
      equipo: {
        id: equipoId,
        cliente_id: targetClienteId,
        tipo,
        marca,
        modelo,
        numero_serie,
        motivo_ingreso,
        estado: "RECIBIDO"
      }
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

export async function obtenerEquiposCliente(req, res) {
  try {
    const { clienteId } = req.params
    const equipos = await obtenerEquiposPorClienteBD(clienteId)
    return res.status(200).json(equipos)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}