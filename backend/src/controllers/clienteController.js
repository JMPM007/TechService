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