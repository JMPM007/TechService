import { EquipoModel } from "../models/equipoModel.js"

export const EquipoController = {
  // HU-13: Consultar listado y búsqueda de equipos
  async getEquipos(req, res) {
    try {
      const { search } = req.query
      const equipos = await EquipoModel.findAll({ search })
      res.json({
        success: true,
        total: equipos.length,
        equipos
      })
    } catch (error) {
      console.error("Error al obtener equipos:", error)
      res.status(500).json({
        success: false,
        error: "Error interno del servidor al consultar equipos"
      })
    }
  },

  // HU-13: Consultar ficha técnica y propiedades del equipo por ID
  async getEquipoById(req, res) {
    try {
      const { id } = req.params
      const equipo = await EquipoModel.findById(id)

      if (!equipo) {
        // Criterio HU-13: Informar al usuario cuando el equipo no exista o no se encuentre registrado
        return res.status(404).json({
          success: false,
          error: "El equipo consultado no existe o no se encuentra registrado en el sistema."
        })
      }

      // La consulta no modifica datos (solo lectura)
      res.json({
        success: true,
        equipo
      })
    } catch (error) {
      console.error("Error al obtener ficha técnica:", error)
      res.status(500).json({
        success: false,
        error: "Error al consultar la ficha técnica del equipo"
      })
    }
  },

  // HU-13: Buscar equipo directamente por número de serie
  async getEquipoBySerie(req, res) {
    try {
      const { serie } = req.params
      if (!serie || serie.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Debe ingresar un número de serie para realizar la búsqueda."
        })
      }

      const equipo = await EquipoModel.findByNumeroSerie(serie)

      if (!equipo) {
        // Criterio HU-13: Informar al usuario cuando el equipo consultado no exista o no se encuentre registrado
        return res.status(404).json({
          success: false,
          error: `El equipo con número de serie "${serie}" no existe o no se encuentra registrado.`
        })
      }

      res.json({
        success: true,
        equipo
      })
    } catch (error) {
      console.error("Error al buscar por número de serie:", error)
      res.status(500).json({
        success: false,
        error: "Error al buscar el equipo por número de serie"
      })
    }
  },

  // HU-14: Editar características de un equipo
  async updateEquipo(req, res) {
    try {
      const { id } = req.params
      const {
        tipo_equipo,
        marca,
        modelo,
        numero_serie,
        procesador,
        memoria_ram,
        almacenamiento,
        tarjeta_grafica,
        sistema_operativo,
        estado_fisico,
        accesorios,
        observaciones
      } = req.body

      // Criterio HU-14: El sistema debe impedir guardar cuando los campos obligatorios se encuentren vacíos o contengan datos inválidos
      const errores = []
      if (!tipo_equipo || tipo_equipo.trim() === "") {
        errores.push("El tipo de equipo es obligatorio.")
      }
      if (!marca || marca.trim() === "") {
        errores.push("La marca del equipo es obligatoria.")
      }
      if (!modelo || modelo.trim() === "") {
        errores.push("El modelo del equipo es obligatorio.")
      }
      if (!numero_serie || numero_serie.trim() === "") {
        errores.push("El número de serie es obligatorio.")
      }

      if (errores.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos o incompletos",
          detalles: errores
        })
      }

      // Verificar existencia previa
      const existing = await EquipoModel.findById(id)
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "El equipo a editar no existe o no se encuentra registrado."
        })
      }

      // Validar si el número de serie ya está en uso por otro equipo
      if (numero_serie.trim().toLowerCase() !== existing.numero_serie.trim().toLowerCase()) {
        const duplicateSerie = await EquipoModel.findByNumeroSerie(numero_serie.trim())
        if (duplicateSerie && duplicateSerie.id !== parseInt(id, 10)) {
          return res.status(400).json({
            success: false,
            error: `El número de serie "${numero_serie}" ya está registrado en otro equipo.`
          })
        }
      }

      // Actualizar datos
      const updatedEquipo = await EquipoModel.update(id, {
        tipo_equipo: tipo_equipo.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        numero_serie: numero_serie.trim(),
        procesador: procesador ? procesador.trim() : "",
        memoria_ram: memoria_ram ? memoria_ram.trim() : "",
        almacenamiento: almacenamiento ? almacenamiento.trim() : "",
        tarjeta_grafica: tarjeta_grafica ? tarjeta_grafica.trim() : "",
        sistema_operativo: sistema_operativo ? sistema_operativo.trim() : "",
        estado_fisico: estado_fisico ? estado_fisico.trim() : "",
        accesorios: accesorios ? accesorios.trim() : "",
        observaciones: observaciones ? observaciones.trim() : ""
      })

      // Criterio HU-14: Mensaje confirmando que las características del equipo fueron actualizadas correctamente
      res.json({
        success: true,
        mensaje: "Las características del equipo fueron actualizadas correctamente.",
        equipo: updatedEquipo
      })
    } catch (error) {
      console.error("Error al actualizar características del equipo:", error)
      res.status(500).json({
        success: false,
        error: "Error interno al actualizar la información del equipo."
      })
    }
  },

  // Registrar un nuevo equipo
  async createEquipo(req, res) {
    try {
      const {
        cliente_id,
        numero_serie,
        tipo_equipo,
        marca,
        modelo,
        procesador,
        memoria_ram,
        almacenamiento,
        tarjeta_grafica,
        sistema_operativo,
        estado_fisico,
        accesorios,
        observaciones
      } = req.body

      const errores = []
      if (!cliente_id) errores.push("Debe asociar un cliente válido.")
      if (!numero_serie || numero_serie.trim() === "") errores.push("El número de serie es obligatorio.")
      if (!tipo_equipo || tipo_equipo.trim() === "") errores.push("El tipo de equipo es obligatorio.")
      if (!marca || marca.trim() === "") errores.push("La marca es obligatoria.")
      if (!modelo || modelo.trim() === "") errores.push("El modelo es obligatorio.")

      if (errores.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Datos de equipo incompletos",
          detalles: errores
        })
      }

      // Validar si el número de serie ya existe
      const duplicate = await EquipoModel.findByNumeroSerie(numero_serie.trim())
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `Ya existe un equipo registrado con el número de serie "${numero_serie}".`
        })
      }

      const nuevoEquipo = await EquipoModel.create({
        cliente_id,
        numero_serie: numero_serie.trim(),
        tipo_equipo: tipo_equipo.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        procesador: procesador?.trim(),
        memoria_ram: memoria_ram?.trim(),
        almacenamiento: almacenamiento?.trim(),
        tarjeta_grafica: tarjeta_grafica?.trim(),
        sistema_operativo: sistema_operativo?.trim(),
        estado_fisico: estado_fisico?.trim(),
        accesorios: accesorios?.trim(),
        observaciones: observaciones?.trim()
      })

      res.status(201).json({
        success: true,
        mensaje: "Equipo registrado exitosamente en el sistema.",
        equipo: nuevoEquipo
      })
    } catch (error) {
      console.error("Error al registrar equipo:", error)
      res.status(500).json({
        success: false,
        error: "Error al registrar el equipo"
      })
    }
  }
}
