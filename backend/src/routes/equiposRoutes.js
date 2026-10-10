import { Router } from "express"
import { registrarEquipo, obtenerEquiposCliente } from "../controllers/equiposController.js"
import { EquipoController } from "../controllers/equipoController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js"

const router = Router()

router.post("/", verifyToken, authorizeRoles("ADMIN", "TECNICO"), registrarEquipo)
router.get("/", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.getEquipos)
router.get("/serie/:serie", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.getEquipoBySerie)
router.get("/:id", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.getEquipoById)
router.get("/cliente/:clienteId", verifyToken, authorizeRoles("ADMIN", "TECNICO", "CLIENTE"), obtenerEquiposCliente)
router.put("/:id", verifyToken, authorizeRoles("ADMIN", "TECNICO"), EquipoController.updateEquipo)

export default router
