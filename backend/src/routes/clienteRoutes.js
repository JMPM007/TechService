import { Router } from "express"
import { buscarClientePorCedula, registrarCliente } from "../controllers/clienteController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js"

const router = Router()

router.post("/clientes", registrarCliente)
router.get("/clientes/cedula/:cedula", verifyToken, authorizeRoles("ADMIN", "TECNICO"), buscarClientePorCedula)

export default router