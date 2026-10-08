<<<<<<< HEAD
import { buscarClientePorCedulaOEmail, crearCliente } from "../models/clienteModel.js"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_REGEX = /^[0-9]{7,15}$/

export async function registrarCliente(req, res) {
    try {
        const { cedula, nombres, apellidos, telefono, email } = req.body

        // 1. Validar campos obligatorios
        const camposObligatorios = { cedula, nombres, apellidos, telefono, email }
        const camposFaltantes = Object.entries(camposObligatorios)
            .filter(([, valor]) => !valor || String(valor).trim() === "")
            .map(([campo]) => campo)

        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                error: "Faltan campos obligatorios",
                camposFaltantes
            })
        }

        // 2. Validar formato de correo
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: "El correo electrónico no tiene un formato válido" })
        }

        // 3. Validar formato de teléfono (solo dígitos, 7 a 15 caracteres)
        if (!TELEFONO_REGEX.test(telefono)) {
            return res.status(400).json({ error: "El teléfono no tiene un formato válido" })
        }

        // 4. Verificar que no exista ya (por cédula o email)
        const clienteExistente = await buscarClientePorCedulaOEmail(cedula, email)
        if (clienteExistente) {
            return res.status(409).json({ error: "Ya existe un cliente registrado con esa cédula o correo" })
        }

        // 5. Crear cliente
        const nuevoCliente = await crearCliente({ cedula, nombres, apellidos, telefono, email })
        return res.status(201).json({ mensaje: "Cliente registrado exitosamente", cliente: nuevoCliente })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

export async function buscarClientePorCedula(req, res) {
    try {
        const { cedula } = req.params

        if (!cedula || String(cedula).trim() === "") {
            return res.status(400).json({ error: "Cédula requerida" })
        }

        const cliente = await buscarClientePorCedulaOEmail(cedula.trim(), "")
        
        if (!cliente) {
            return res.status(404).json({ 
                error: "No se encontró ningún cliente con esa cédula" 
            })
        }

        return res.json(cliente)

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}
=======
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
>>>>>>> origin/HU-13-14-15
