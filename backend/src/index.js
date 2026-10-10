import express from 'express'
import cors from 'cors'
import pool from './config/db.js'
import profileRoutes from './routes/profileRoutes.js'
import userRoutes from './routes/userRoutes.js'
import clienteRoutes from './routes/clienteRoutes.js'
import technicianRoutes from './routes/technicianRoutes.js'
import equiposRoutes from './routes/equiposRoutes.js'
import ordenRoutes from './routes/ordenRoutes.js'
import cotizacionRoutes from './routes/cotizacionRoutes.js'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.use('/api/usuarios', userRoutes)
app.use('/api', clienteRoutes)
app.use('/api/tecnicos', technicianRoutes)
app.use('/api/equipos', equiposRoutes)
app.use('/api/ordenes', ordenRoutes)
app.use('/api/ordenes', cotizacionRoutes)

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, creado_en AS creadoEn FROM usuarios',
    )

    res.json({
      mensaje: 'Conexión a la base de datos exitosa.',
      usuarios: rows,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      mensaje: 'No fue posible conectar con la base de datos.',
    })
  }
})

app.use('/api/perfil', profileRoutes)

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' })
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`)
})