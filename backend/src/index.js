import cors from 'cors'
import express from 'express'
import process from 'node:process'
import pool from './config/db.js'
import clienteRoutes from './routes/clienteRoutes.js'
import cotizacionRoutes from './routes/cotizacionRoutes.js'
import equiposRoutes from './routes/equiposRoutes.js'
import ordenRoutes from './routes/ordenRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import technicianRoutes from './routes/technicianRoutes.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.use('/api/usuarios', userRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/api/tecnicos', technicianRoutes)
app.use('/api/equipos', equiposRoutes)
app.use('/api/ordenes', ordenRoutes)
app.use('/api/ordenes', cotizacionRoutes)
app.use('/api/perfil', profileRoutes)

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, creado_en AS creadoEn FROM usuarios',
    )
    return res.json({
      mensaje: 'Conexión a la base de datos exitosa.',
      usuarios: rows,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      mensaje: 'No fue posible conectar con la base de datos.',
    })
  }
})

app.use((req, res) => {
  return res.status(404).json({ mensaje: 'Ruta no encontrada.' })
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`)
})
