import { buscarClientePorCedulaOEmail, crearCliente } from '../models/clienteModel.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_REGEX = /^[0-9]{7,15}$/

export async function registrarCliente(req, res) {
  try {
    const { cedula, nombres, apellidos, telefono, email } = req.body
    const campos = { cedula, nombres, apellidos, telefono, email }
    const camposFaltantes = Object.entries(campos)
      .filter(([, value]) => !value || String(value).trim() === '')
      .map(([campo]) => campo)

    if (camposFaltantes.length) {
      return res.status(400).json({ error: 'Faltan campos obligatorios', camposFaltantes })
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'El correo electrónico no tiene un formato válido' })
    }
    if (!TELEFONO_REGEX.test(telefono)) {
      return res.status(400).json({ error: 'El teléfono no tiene un formato válido' })
    }

    const existente = await buscarClientePorCedulaOEmail(cedula, email)
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un cliente registrado con esa cédula o correo' })
    }

    const cliente = await crearCliente({ cedula, nombres, apellidos, telefono, email })
    return res.status(201).json({ mensaje: 'Cliente registrado exitosamente', cliente })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible registrar el cliente' })
  }
}

export async function buscarClientePorCedula(req, res) {
  try {
    const cedula = req.params.cedula?.trim()
    if (!cedula) return res.status(400).json({ error: 'Cédula requerida' })

    const cliente = await buscarClientePorCedulaOEmail(cedula, '')
    if (!cliente) return res.status(404).json({ error: 'No se encontró ningún cliente con esa cédula' })
    return res.json(cliente)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible buscar el cliente' })
  }
}
