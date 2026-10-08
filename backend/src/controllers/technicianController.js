import bcrypt from 'bcryptjs'
import { createUser, findUserByEmail } from '../models/userModel.js'
import {
  createTechnician,
  findTechnicianByCedula,
  findTechnicianByTelefono,
  getAllTechnicians,
  updateTechnicianStatus as updateTechnicianStatusInDb,
} from '../models/tecnicoModel.js'

export async function registerTechnician(req, res) {
  const { nombre, email, password, cedula, telefono, especialidad } = req.body ?? {}
  if (![nombre, email, password, cedula, telefono, especialidad].every(
    (value) => typeof value === 'string' && value.trim(),
  )) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    if (await findUserByEmail(normalizedEmail)) {
      return res.status(409).json({ error: 'El correo ya se encuentra registrado.' })
    }
    if (await findTechnicianByTelefono(telefono.trim())) {
      return res.status(409).json({ error: 'El número de teléfono ya se encuentra registrado.' })
    }
    if (await findTechnicianByCedula(cedula.trim())) {
      return res.status(409).json({ error: 'La cédula ya se encuentra registrada.' })
    }

    const usuario_id = await createUser({
      nombre: nombre.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      rol: 'TECNICO',
    })
    const result = await createTechnician({
      usuario_id,
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      especialidad: especialidad.trim(),
    })
    return res.status(201).json({
      mensaje: 'Técnico registrado exitosamente.',
      usuario_id,
      tecnico_id: result.insertId,
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo, teléfono o cédula ya están registrados.' })
    }
    console.error(error)
    return res.status(500).json({ error: 'No fue posible registrar el técnico.' })
  }
}

export async function getTechnicians(req, res) {
  try {
    return res.json(await getAllTechnicians())
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible obtener los técnicos.' })
  }
}

export async function updateTechnicianStatus(req, res) {
  const estadosValidos = ['DISPONIBLE', 'OCUPADO', 'INACTIVO']
  if (!estadosValidos.includes(req.body?.estado)) {
    return res.status(400).json({ error: 'Estado no válido.' })
  }

  try {
    const result = await updateTechnicianStatusInDb(req.params.id, req.body.estado)
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró el técnico.' })
    }
    return res.json({ mensaje: 'Estado del técnico actualizado correctamente.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible actualizar el estado.' })
  }
}
