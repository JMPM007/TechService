import { Router } from "express"
import { EquipoController } from "../controllers/equipoController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js"

const router = Router()

router.post("/", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.registrarEquipo)
router.get("/", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.getEquipos)
router.get("/serie/:serie", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.getEquipoBySerie)
router.get("/:id", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.getEquipoById)
router.get("/cliente/:clienteId", verifyToken, authorizeRoles("ADMIN", "TECNICO", "CLIENTE"), EquipoController.obtenerEquiposCliente)
router.put("/:id", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.updateEquipo)

export default router
