import { Router } from "express"
import { OrdenServicioController } from "../controllers/ordenServicioController.js"
import { asignarOrden, actualizarEstado, cerrarOrden } from "../controllers/ordenController.js"

const router = Router()

router.post("/", OrdenServicioController.createOrden)
router.get("/", OrdenServicioController.getOrdenes)
router.get("/:id", OrdenServicioController.getOrdenById)

router.patch("/:id/asignar", asignarOrden)
router.patch("/:id/estado", actualizarEstado)
router.patch("/:id/cerrar", cerrarOrden)

export default router
