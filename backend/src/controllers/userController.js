import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import process from 'node:process'
import {
  cambiarEstadoUsuarioTransaccional,
  createClientUser,
  editarUsuarioTransaccional,
  findUserByEmail,
  findUserById,
  listarUsuarios,
  ROLES_VALIDOS,
} from '../models/userModel.js'

function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
  }
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export async function loginUser(req, res) {
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password

  if (!email || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ mensaje: 'El correo y la contraseña son obligatorios.' })
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ mensaje: 'JWT_SECRET no está configurado en el servidor.' })
  }

  try {
    const user = await findUserByEmail(email)
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false
    if (!passwordMatches) return res.status(401).json({ mensaje: 'Credenciales inválidas.' })
    if (user.activo !== undefined && Number(user.activo) === 0) {
      return res.status(403).json({
        mensaje: 'Esta cuenta ha sido desactivada. Contacta al administrador.',
      })
    }

    const token = jwt.sign(
      { sub: String(user.id), rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    )
    return res.json({
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: publicUser(user),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'Ocurrió un error al iniciar sesión.' })
  }
}

export async function registerUser(req, res) {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : ''
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password

  if (nombre.length < 2 || nombre.length > 100 || !email || typeof password !== 'string') {
    return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios.' })
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener entre 8 y 72 caracteres.' })
  }

  try {
    if (await findUserByEmail(email)) {
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const { id, clienteId } = await createClientUser({
      nombre,
      email,
      password: passwordHash,
    })
    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      usuario: { id, nombre, email, rol: 'CLIENTE', clienteInfo: clienteId },
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' })
    }
    console.error(error)
    return res.status(500).json({ mensaje: 'Ocurrió un error al registrar el usuario.' })
  }
}

export async function listUsers(req, res) {
  const rol = typeof req.query.rol === 'string' ? req.query.rol.toUpperCase() : ''
  const activo = typeof req.query.activo === 'string' ? req.query.activo : ''

  if (rol && !ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({
      mensaje: `Rol inválido. Valores aceptados: ${ROLES_VALIDOS.join(', ')}`,
    })
  }
  if (activo && activo !== '0' && activo !== '1') {
    return res.status(400).json({ mensaje: 'El parámetro activo debe ser 0 o 1.' })
  }

  try {
    const usuarios = await listarUsuarios({ rol, activo })
    return res.json({ success: true, total: usuarios.length, usuarios })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      mensaje: 'No fue posible cargar la lista de usuarios. Inténtalo nuevamente.',
    })
  }
}

export async function getUser(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de usuario inválido.' })
  }

  try {
    const usuario = await findUserById(id)
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' })
    return res.json({ usuario })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible obtener el usuario.' })
  }
}

export async function editUser(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de usuario inválido.' })
  }
  if (req.user.id === id && req.body?.rol !== undefined) {
    return res.status(403).json({ mensaje: 'No puedes modificar tu propio rol.' })
  }

  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : undefined
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : undefined
  const rol = typeof req.body?.rol === 'string' ? req.body.rol.toUpperCase() : undefined
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (nombre !== undefined && (nombre.length < 2 || nombre.length > 100)) {
    return res.status(400).json({ mensaje: 'El nombre debe tener entre 2 y 100 caracteres.' })
  }
  if (email !== undefined && !emailRegex.test(email)) {
    return res.status(400).json({ mensaje: 'El correo electrónico no tiene un formato válido.' })
  }
  if (rol !== undefined && !ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({
      mensaje: `Rol inválido. Valores aceptados: ${ROLES_VALIDOS.join(', ')}`,
    })
  }
  if (nombre === undefined && email === undefined && rol === undefined) {
    return res.status(400).json({ mensaje: 'Debes enviar al menos un campo para actualizar.' })
  }

  try {
    const resultado = await editarUsuarioTransaccional(id, { nombre, email, rol })
    if (!resultado.exito) {
      return res.status(resultado.codigo).json({ mensaje: resultado.mensaje })
    }
    return res.json({ mensaje: 'Usuario actualizado correctamente.', usuario: resultado.usuario })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado por otro usuario.' })
    }
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible actualizar el usuario.' })
  }
}

export async function toggleUserStatus(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de usuario inválido.' })
  }
  if (req.user.id === id) {
    return res.status(403).json({
      mensaje: 'No puedes modificar el estado de tu propia cuenta desde este panel.',
    })
  }

  const { activo } = req.body ?? {}
  if (activo !== 0 && activo !== 1 && activo !== true && activo !== false) {
    return res.status(400).json({ mensaje: 'El campo activo debe ser 0 o 1.' })
  }

  try {
    const nuevoEstado = Number(activo) === 1 || activo === true ? 1 : 0
    const resultado = await cambiarEstadoUsuarioTransaccional(id, nuevoEstado)
    if (!resultado.exito) {
      return res.status(resultado.codigo).json({ mensaje: resultado.mensaje })
    }
    return res.json({
      mensaje: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`,
      usuario: resultado.usuario,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible cambiar el estado del usuario.' })
  }
}
