import { ClienteModel } from "../models/clienteModel.js"

export const ClienteController = {
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

  async getClienteByCedula(req, res) {
    try {
      const cliente = await ClienteModel.findByCedula(req.params.cedula)
      if (!cliente) return res.status(404).json({ error: "Cliente no encontrado con esa cédula" })
      res.json(cliente)
    } catch (error) {
      console.error("Error al buscar cliente por cédula:", error)
      res.status(500).json({ error: "Error al buscar cliente" })
    }
  },

  async createCliente(req, res) {
    try {
      const { cedula, nombre, direccion, telefono, email } = req.body ?? {}
      if (!cedula || !nombre || !telefono) {
        return res.status(400).json({ error: "Cédula, nombre y teléfono son obligatorios." })
      }

      const existing = await ClienteModel.findByCedula(cedula)
      if (existing) {
        return res.status(409).json({ error: "Ya existe un cliente registrado con esa cédula." })
      }

      const nuevo = await ClienteModel.create({ cedula, nombre, direccion, telefono, email })
      res.status(201).json(nuevo)
    } catch (error) {
      console.error("Error al registrar cliente:", error)
      res.status(500).json({ error: "Error interno al crear cliente." })
    }
  },

  async updateCliente(req, res) {
    try {
      const id = parseInt(req.params.id, 10)
      const { nombre, direccion, telefono, email } = req.body ?? {}

      if (!nombre || !telefono) {
        return res.status(400).json({ error: "Nombre y teléfono son obligatorios." })
      }

      const existing = await ClienteModel.findById(id)
      if (!existing) {
        return res.status(404).json({ error: "Cliente no encontrado." })
      }

      const updated = await ClienteModel.update(id, { nombre, direccion, telefono, email })
      res.json(updated)
    } catch (error) {
      console.error("Error al actualizar cliente:", error)
      res.status(500).json({ error: "Error al actualizar cliente." })
    }
  },

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
