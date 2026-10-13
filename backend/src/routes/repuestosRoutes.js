import { Router } from "express"
import { agregarRepuestoAOrden } from "../controllers/ordenRepuestosController.js"
import { authorizeRoles, verifyToken } from "../middlewares/authMiddleware.js"
import { ingresarReabastecimiento, listarRepuestos, registrarRepuesto } from "../controllers/repuestosController.js"

const router = Router()

router.post("/orden", verifyToken, authorizeRoles("ADMIN", "TECNICO"), agregarRepuestoAOrden)
router.post("/nuevorepuesto", verifyToken, authorizeRoles("ADMIN", "TECNICO"), registrarRepuesto)
router.get("/inventario", verifyToken, authorizeRoles("ADMIN", "TECNICO"), listarRepuestos)
router.post("/reabastecimiento", verifyToken, authorizeRoles("ADMIN", "TECNICO"), ingresarReabastecimiento)

export default router