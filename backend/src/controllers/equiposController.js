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

export const EquipoController = {
  // === HU-12: REGISTRAR EQUIPO EN RECEPCIÓN (Tu desarrollo local) ===
  async registrarEquipo(req, res) {
    try {
      const {
        cliente_id,
        cedula,
        tipo,
        tipo_equipo,
        marca,
        modelo,
        numero_serie,
        motivo_ingreso,
        procesador,
        memoria_ram,
        almacenamiento,
        tarjeta_grafica,
        sistema_operativo,
        estado_fisico,
        accesorios,
        observaciones,
      } = req.body ?? {}
      const tipoEquipo = tipo ?? tipo_equipo
      let targetClienteId = cliente_id

      if (!targetClienteId && cedula) {
        const cliente = await buscarClientePorCedulaOEmail(cedula.trim(), null)
        if (!cliente) {
          return res.status(404).json({ error: "No se encontró ningún cliente con la cédula ingresada" })
        }
        targetClienteId = cliente.id
      } else if (targetClienteId) {
        const [rows] = await pool.query("SELECT id FROM clientes WHERE id = ? LIMIT 1", [targetClienteId])
        if (rows.length === 0) {
          return res.status(404).json({ error: "El ID del cliente proporcionado no existe en el sistema." })
        }
      } else {
        return res.status(400).json({ error: "Es obligatorio asociar un cliente mediante cliente_id o cedula." })
      }

      if (!targetClienteId || !tipoEquipo?.trim() || !modelo?.trim()) {
        return res.status(400).json({
          error: "Los campos cliente, tipo y modelo son obligatorios"
        })
      }

      const equipoId = await crearEquipo({
        cliente_id: targetClienteId,
        tipo: tipoEquipo.trim(),
        marca: marca?.trim() || null,
        modelo: modelo.trim(),
        numero_serie: numero_serie?.trim() || null,
        motivo_ingreso: motivo_ingreso?.trim() || null,
        procesador: procesador?.trim(),
        memoria_ram: memoria_ram?.trim(),
        almacenamiento: almacenamiento?.trim(),
        tarjeta_grafica: tarjeta_grafica?.trim(),
        sistema_operativo: sistema_operativo?.trim(),
        estado_fisico: estado_fisico?.trim(),
        accesorios: accesorios?.trim(),
        observaciones: observaciones?.trim(),
      })

      return res.status(201).json({
        mensaje: "Equipo registrado exitosamente en recepción",
        equipo: {
          id: equipoId,
          cliente_id: targetClienteId,
          tipo: tipoEquipo,
          marca,
          modelo,
          numero_serie,
          motivo_ingreso: motivo_ingreso || null,
          procesador: procesador || null,
          memoria_ram: memoria_ram || null,
          almacenamiento: almacenamiento || null,
          tarjeta_grafica: tarjeta_grafica || null,
          sistema_operativo: sistema_operativo || null,
          estado_fisico: estado_fisico || null,
          accesorios: accesorios || null,
          observaciones: observaciones || null,
          estado: "RECIBIDO"
        }
      })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  },

  // === HU-12: OBTENER EQUIPOS DE CLIENTE (Tu desarrollo local) ===
  async obtenerEquiposCliente(req, res) {
    try {
      const { clienteId } = req.params
      const equipos = await obtenerEquiposPorCliente(clienteId)
      return res.status(200).json(equipos)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  },

  // === HU-13: CONSULTAR EQUIPO POR ID (Desarrollo del equipo) ===
  async obtenerEquipo(req, res) {
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
  },

  // === HU-13: BUSCAR POR MARCA Y SERIAL (Desarrollo del equipo) ===
  async buscarEquipoPorMarcaYSerial(req, res) {
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
  },

  // === HU-13: LISTAR FICHAS TÉCNICAS (Desarrollo del equipo) ===
  async listarFichaEquipos(req, res) {
    try {
      const equipos = await listarEquipos({ search: req.query.search })
      return res.json({ success: true, total: equipos.length, equipos })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, mensaje: 'No fue posible consultar los equipos.' })
    }
  },

  // === HU-13: BUSCAR POR SERIAL EXACTO (Desarrollo del equipo) ===
  async buscarEquipoPorSerialExacto(req, res) {
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
  },

  // === HU-14: EDITAR FICHA TÉCNICA DEL EQUIPO (Desarrollo del equipo) ===
  async editarFichaEquipo(req, res) {
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
        tipo: datos.tipo.trim(),
        marca: datos.marca.trim(),
        modelo: datos.modelo.trim(),
        numeroSerie: datos.numeroSerie.trim(),
        procesador: datos.procesador?.trim(),
        memoriaRam: datos.memoriaRam?.trim(),
        almacenamiento: datos.almacenamiento?.trim(),
        tarjetaGrafica: datos.tarjetaGrafica?.trim(),
        sistemaOperativo: datos.sistemaOperativo?.trim(),
        estadoFisico: datos.estadoFisico?.trim(),
        accesorios: datos.accesorios?.trim(),
        observaciones: datos.observaciones?.trim(),
      })
      return res.json({ success: true, mensaje: 'Ficha técnica actualizada correctamente.', equipo })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ mensaje: 'No fue posible actualizar la ficha técnica del equipo.' })
    }
  }
}
