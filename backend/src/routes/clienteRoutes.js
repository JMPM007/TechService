import { Router } from "express"
<<<<<<< HEAD
import { buscarClientePorCedula, registrarCliente } from "../controllers/clienteController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js"

const router = Router()

router.post("/clientes", registrarCliente)
router.get("/clientes/cedula/:cedula", verifyToken, authorizeRoles("ADMIN", "TECNICO"), buscarClientePorCedula)

export default router
=======
import { ClienteController } from "../controllers/clienteController.js"

const router = Router()

router.get("/", ClienteController.getClientes)
router.get("/tecnicos", ClienteController.getTecnicos)
router.get("/cedula/:cedula", ClienteController.getClienteByCedula)
router.get("/:id", ClienteController.getClienteById)
router.post("/", ClienteController.createCliente)
router.put("/:id", ClienteController.updateCliente)

export default router
>>>>>>> origin/HU-13-14-15
