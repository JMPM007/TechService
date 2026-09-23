import { Router } from "express"
import { asignarOrden, actualizarEstado, cerrarOrden, obtenerOrdenes } from "../controllers/ordenController.js"

const router = Router()

router.get("/ordenes", obtenerOrdenes)
router.patch("/ordenes/:id/asignar", asignarOrden)
router.patch("/ordenes/:id/estado", actualizarEstado)
router.patch("/ordenes/:id/cerrar", cerrarOrden)

export default router