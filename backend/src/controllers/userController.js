import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import process from 'node:process'
import { createUser, findUserByEmail } from '../models/userModel.js'

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
    return res.status(400).json({
      mensaje: 'El correo y la contraseña son obligatorios.',
    })
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      mensaje: 'JWT_SECRET no está configurado en el servidor.',
    })
  }

  try {
    const user = await findUserByEmail(email)
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false

    if (!passwordMatches) {
      return res.status(401).json({
        mensaje: 'Credenciales inválidas.',
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
    return res.status(500).json({
      mensaje: 'Ocurrió un error al iniciar sesión.',
    })
  }
}

export async function registerUser(req, res) {
  const nombre = typeof req.body?.nombre === 'string'
    ? req.body.nombre.trim()
    : ''
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password

  if (nombre.length < 2 || nombre.length > 100 || !email
    || typeof password !== 'string') {
    return res.status(400).json({
      mensaje: 'Nombre, correo y contraseña son obligatorios.',
    })
  }

  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({
      mensaje: 'La contraseña debe tener entre 8 y 72 caracteres.',
    })
  }

  try {
    if (await findUserByEmail(email)) {
      return res.status(409).json({
        mensaje: 'El correo electrónico ya está registrado.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const id = await createUser({
      nombre,
      email,
      password: passwordHash,
      rol: 'CLIENTE',
    })

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      usuario: { id, nombre, email, rol: 'CLIENTE' },
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        mensaje: 'El correo electrónico ya está registrado.',
      })
    }

    console.error(error)
    return res.status(500).json({
      mensaje: 'Ocurrió un error al registrar el usuario.',
    })
  }
}