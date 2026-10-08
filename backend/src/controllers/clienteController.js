import { buscarClientePorCedulaOEmail, crearCliente } from "../models/clienteModel.js"
import { ClienteModel } from "../models/clienteModel.js"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_REGEX = /^[0-9]{7,15}$/

export const ClienteController = {
  // HU-13: Obtener listado general de clientes con filtro de búsqueda
  async getClientes(req, res) {
    try {
      const search = req.query.search || ""
      const clientes = await ClienteModel.findAll(search)
      res.json(clientes)
    } catch (error) {
      console.error("Error al obtener clientes:", error)
      res.status(500).json({ error: "Error al listar clientes" })
    }
  },

  // HU-13: Obtener detalles de un cliente por su ID
  async getClienteById(req, res) {
    try {
      const cliente = await ClienteModel.findById(req.params.id)
      if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" })
      res.json(cliente)
    } catch (error) {
      console.error("Error al obtener cliente:", error)
      res.status(500).json({ error: "Error al consultar cliente" })
    }
  },

  // Buscar cliente por cédula (Validaciones locales unificadas)
  async getClienteByCedula(req, res) {
    try {
      const { cedula } = req.params

      if (!cedula || String(cedula).trim() === "") {
        return res.status(400).json({ error: "Cédula requerida" })
      }

      const cliente = await buscarClientePorCedulaOEmail(cedula.trim(), "")
      if (!cliente) {
        return res.status(404).json({ error: "No se encontró ningún cliente con esa cédula" })
      }
      return res.json(cliente)
    } catch (error) {
      console.error("Error al buscar cliente por cédula:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Registrar cliente unificado (Validaciones estrictas + campos adaptados)
  async createCliente(req, res) {
    try {
      const { cedula, nombres, apellidos, direccion, telefono, email } = req.body ?? {}

      const camposObligatorios = { cedula, nombres, apellidos, telefono, email }
      const camposFaltantes = Object.entries(camposObligatorios)
          .filter(([, valor]) => !valor || String(valor).trim() === "")
          .map(([campo]) => campo)

      if (camposFaltantes.length > 0) {
          return res.status(400).json({ error: "Faltan campos obligatorios", camposFaltantes })
      }

      if (!EMAIL_REGEX.test(email)) {
          return res.status(400).json({ error: "El correo electrónico no tiene un formato válido" })
      }
      if (!TELEFONO_REGEX.test(telefono)) {
          return res.status(400).json({ error: "El teléfono no tiene un formato válido (7-15 dígitos)" })
      }

      const existing = await buscarClientePorCedulaOEmail(cedula, email)
      if (existing) {
          return res.status(409).json({ error: "Ya existe un cliente registrado con esa cédula o correo" })
      }

      const nuevo = await crearCliente({ cedula, nombres, apellidos, direccion, telefono, email })
      res.status(201).json({ mensaje: "Cliente registrado exitosamente", cliente: nuevo })
    } catch (error) {
      console.error("Error al registrar cliente:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Actualizar características del cliente
  async updateCliente(req, res) {
    try {
      const id = parseInt(req.params.id, 10)
      const { nombres, apellidos, direccion, telefono, email } = req.body ?? {}

      if (!nombres || !apellidos || !telefono) {
        return res.status(400).json({ error: "Nombres, apellidos y teléfono son obligatorios." })
      }

      const existing = await ClienteModel.findById(id)
      if (!existing) {
        return res.status(404).json({ error: "Cliente no encontrado." })
      }

      const updated = await ClienteModel.update(id, { nombres, apellidos, direccion, telefono, email })
      res.json(updated)
    } catch (error) {
      console.error("Error al actualizar cliente:", error)
      res.status(500).json({ error: "Error al actualizar cliente." })
    }
  },

  // Listar técnicos asignables
  async getTecnicos(req, res) {
    try {
      const tecnicos = await ClienteModel.findTecnicos()
      res.json({ success: true, tecnicos })
    } catch (error) {
      console.error("Error al obtener técnicos:", error)
      res.status(500).json({ success: false, error: "Error al listar técnicos" })
    }
  }
}
