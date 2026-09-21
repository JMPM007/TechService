import { Router } from "express"
import { ClienteController } from "../controllers/clienteController.js"

const router = Router()

router.get("/", ClienteController.getClientes)
router.get("/tecnicos", ClienteController.getTecnicos)
router.get("/cedula/:cedula", ClienteController.getClienteByCedula)
router.get("/:id", ClienteController.getClienteById)
router.post("/", ClienteController.createCliente)
router.put("/:id", ClienteController.updateCliente)

export default router
