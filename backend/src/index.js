import express from "express"
import cors from "cors"
import process from "node:process"
import pool from "./config/db.js"
import userRoutes from "./routes/userRoutes.js"
import technicianRoutes from "./routes/technicianRoutes.js"
import equiposRoutes from "./routes/equiposRoutes.js"
import clienteRoutes from "./routes/clienteRoutes.js"


const app = express()

app.use(cors())
app.use(express.json())

app.use("/api", clienteRoutes)

app.get("/api/test-db", async(req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios")
        res.json({mensaje: "Conexion a la BD exitosa", usuarios: rows})
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

app.use("/api/usuarios", userRoutes)
app.use("/api/tecnicos", technicianRoutes)
app.use("/api/equipos", equiposRoutes)



const PORT = process.env.PORT || 3000
app.listen(PORT, () =>{
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`)
})