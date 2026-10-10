import { OrdenServicioModel } from "../models/ordenServicioModel.js"
import { EquipoModel } from "../models/equipoModel.js"
// Importamos el modelo complementario de tus compañeros para el historial de estados
import { OrdenModel } from "../models/ordenModel.js" 

export const OrdenServicioController = {
  // === HU-15: CREAR ORDEN DE SERVICIO (Tu desarrollo local) ===
  async createOrden(req, res) {
    try {
      const {
        equipo_id,
        tecnico_id,
        motivo_ingreso,
        tipo_servicio,
        prioridad,
        costo_estimado,
        abono_inicial,
        observaciones_recepcion
      } = req.body

      const errores = []
      if (!equipo_id) errores.push("Debe seleccionar un equipo válido.")
      if (!motivo_ingreso || motivo_ingreso.trim() === "") errores.push("El motivo de ingreso / falla reportada es obligatorio.")
      if (!tipo_servicio || tipo_servicio.trim() === "") errores.push("El tipo de servicio es obligatorio.")

      const tiposValidos = [
        "Mantenimiento Preventivo",
        "Mantenimiento Correctivo",
        "Diagnóstico Técnico",
        "Garantía",
        "Instalación Hardware/Software"
      ]
      if (tipo_servicio && !tiposValidos.includes(tipo_servicio.trim())) {
        errores.push("El tipo de servicio seleccionado no es válido.")
      }

      if (prioridad && !["BAJA", "MEDIA", "ALTA", "URGENTE"].includes(prioridad.trim())) {
        errores.push("La prioridad seleccionada no es válida.")
      }

      if (costo_estimado !== undefined && costo_estimado !== "" && isNaN(Number(costo_estimado))) {
        errores.push("El costo estimado debe ser un valor numérico.")
      }
      if (abono_inicial !== undefined && abono_inicial !== "" && isNaN(Number(abono_inicial))) {
        errores.push("El abono inicial debe ser un valor numérico.")
      }

      if (errores.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Datos de la orden inválidos o incompletos",
          detalles: errores
        })
      }

      const equipo = await EquipoModel.findById(equipo_id)
      if (!equipo) {
        return res.status(404).json({
          success: false,
          error: "El equipo seleccionado no existe o no se encuentra registrado en el sistema."
        })
      }

      const nuevaOrden = await OrdenServicioModel.create({
        equipo_id,
        tecnico_id: tecnico_id || null,
        motivo_ingreso: motivo_ingreso.trim(),
        tipo_servicio: tipo_servicio.trim(),
        prioridad: prioridad ? prioridad.trim() : "MEDIA",
        estado: "PENDIENTE",
        costo_estimado: costo_estimado !== undefined && costo_estimado !== "" ? Number(costo_estimado) : 0.00,
        abono_inicial: abono_inicial !== undefined && abono_inicial !== "" ? Number(abono_inicial) : 0.00,
        observaciones_recepcion: observaciones_recepcion ? observaciones_recepcion.trim() : ""
      })

      res.status(201).json({
        success: true,
        mensaje: `La orden de servicio ${nuevaOrden.codigo_orden} fue creada correctamente.`,
        codigo_orden: nuevaOrden.codigo_orden,
        orden: nuevaOrden
      })
    } catch (error) {
      console.error("Error al crear la orden de servicio:", error)
      res.status(500).json({ success: false, error: "Error interno al crear la orden de servicio." })
    }
  },

  // === HU-15: CONSULTAR LISTADO GENERAL (Tu desarrollo local) ===
  async getOrdenes(req, res) {
    try {
      const { search, estado } = req.query
      const ordenes = await OrdenServicioModel.findAll({ search, estado })
      res.json({ success: true, total: ordenes.length, ordenes })
    } catch (error) {
      console.error("Error al listar órdenes de servicio:", error)
      res.status(500).json({ success: false, error: "Error interno al consultar órdenes de servicio." })
    }
  },

  // === HU-15: CONSULTAR POR ID (Tu desarrollo local) ===
  async getOrdenById(req, res) {
    try {
      const { id } = req.params
      const orden = await OrdenServicioModel.findById(id)

      if (!orden) {
        return res.status(404).json({ success: false, error: "La orden de servicio solicitada no existe." })
      }
      res.json({ success: true, orden })
    } catch (error) {
      console.error("Error al obtener orden de servicio:", error)
      res.status(500).json({ success: false, error: "Error al consultar la orden de servicio." })
    }
  },

  // === HU-13 & HU-14: LÓGICA INTEGRADAS DEL EQUIPO ===
  async asignarOrden(req, res) {
    try {
      const { id } = req.params
      const { tecnico_id } = req.body
      if (!tecnico_id) return res.status(400).json({ success: false, error: "ID de técnico requerido." })
      
      const updated = await OrdenModel.assignTecnico(id, tecnico_id)
      res.json({ success: true, mensaje: "Técnico asignado correctamente.", orden: updated })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async actualizarEstado(req, res) {
    try {
      const { id } = req.params
      const { estado_nuevo, estado_anterior } = req.body
      if (!estado_nuevo) return res.status(400).json({ success: false, error: "El nuevo estado es requerido." })

      const updated = await OrdenModel.updateState(id, estado_nuevo, estado_anterior)
      res.json({ success: true, mensaje: "Estado actualizado correctamente.", orden: updated })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async cerrarOrden(req, res) {
    try {
      const { id } = req.params
      const { observaciones_cierre } = req.body
      
      const updated = await OrdenModel.closeOrden(id, observaciones_cierre)
      res.json({ success: true, mensaje: "Orden de servicio cerrada de forma definitiva.", orden: updated })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
