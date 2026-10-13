import { Router } from "express"
import { agregarRepuestoAOrden } from "../controllers/ordenRepuestosController.js"
import { authorizeRoles, verifyToken } from "../middlewares/authMiddleware.js"

const router = Router()

router.post("/", verifyToken, authorizeRoles("ADMIN", "TECNICO"), agregarRepuestoAOrden)

export default router