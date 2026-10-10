import { Router } from "express"
// Importamos el controlador unificado de clientes
import { ClienteController } from "../controllers/clienteController.js"
// Importamos los middlewares de seguridad del proyecto
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js"

const router = Router()


router.post("/", ClienteController.createCliente)
router.get("/", verifyToken, authorizeRoles("ADMIN", "TECNICO"), ClienteController.getClientes)
router.get("/tecnicos", verifyToken, authorizeRoles("ADMIN", "TECNICO"), ClienteController.getTecnicos)
router.get("/cedula/:cedula", verifyToken, authorizeRoles("ADMIN", "TECNICO"), ClienteController.getClienteByCedula)
router.get("/:id", verifyToken, authorizeRoles("ADMIN", "TECNICO", "CLIENTE"), ClienteController.getClienteById)
router.put("/:id", verifyToken, authorizeRoles("ADMIN", "TECNICO"), ClienteController.updateCliente)

export default router
