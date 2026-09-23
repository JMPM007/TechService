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
  const { nombre, email, password, cedula, telefono, especialidad } = req.body
  if (!nombre || !email || !password || !cedula || !telefono || !especialidad) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  try {
    if (await findUserByEmail(email)) return res.status(409).json({ error: 'El correo ya se encuentra registrado' })
    if (await findTechnicianByTelefono(telefono)) return res.status(409).json({ error: 'El número de teléfono ya se encuentra registrado' })
    if (await findTechnicianByCedula(cedula)) return res.status(409).json({ error: 'La cédula ya se encuentra registrada' })

    const usuario_id = await createUser({
      nombre,
      email,
      password: await bcrypt.hash(password, 10),
      rol: 'TECNICO',
    })
    const result = await createTechnician({ usuario_id, cedula, telefono, especialidad })
    return res.status(201).json({ mensaje: 'Técnico registrado exitosamente', usuario_id, tecnico_id: result.insertId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible registrar el técnico' })
  }
}

export async function getTechnicians(req, res) {
  try {
    return res.json(await getAllTechnicians())
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible obtener los técnicos' })
  }
}

export async function updateTechnicianStatus(req, res) {
  const estadosValidos = ['DISPONIBLE', 'OCUPADO', 'INACTIVO']
  if (!estadosValidos.includes(req.body.estado)) return res.status(400).json({ error: 'Estado no válido' })

  try {
    await updateTechnicianStatusInDb(req.params.id, req.body.estado)
    return res.json({ mensaje: 'Estado del técnico actualizado correctamente' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'No fue posible actualizar el estado' })
  }
}
