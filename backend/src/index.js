import express from "express"
import cors from "cors"
import pool from "./config/db.js"
import equipoRoutes from "./routes/equipoRoutes.js"
import ordenServicioRoutes from "./routes/ordenServicioRoutes.js"
import clienteRoutes from "./routes/clienteRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

// Rutas de la API
app.use("/api/equipos", equipoRoutes)
app.use("/api/ordenes", ordenServicioRoutes)
app.use("/api/clientes", clienteRoutes)

app.get("/api/test-db", async(req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios")
        res.json({mensaje: "Conexion a la BD exitosa", usuarios: rows})
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () =>{
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`)
})
