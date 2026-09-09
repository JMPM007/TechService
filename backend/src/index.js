import express from "express"
import cors from "cors"
import process from "node:process"
import pool from "./config/db.js"
import { createClientesRouter } from "./routes/clientes.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use("/api/clientes", createClientesRouter(pool))

app.get("/api/test-db", async(req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios")
        res.json({mensaje: "Conexion a la BD exitosa", usuarios: rows})
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

if (process.env.NODE_ENV !== "test") {
    app.listen(3000, () =>{
        console.log("Servidor ejecutandose en http://localhost:3000")
    })
}

export default app
