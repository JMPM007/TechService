import { Router } from "express"
import { registrarCliente } from "../controllers/clienteController.js"

const router = Router()

router.post("/clientes", registrarCliente)

export default router