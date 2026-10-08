import { Router } from "express"
import { OrdenServicioController } from "../controllers/ordenServicioController.js"

const router = Router()

// HU-15: Crear orden de servicio
router.post("/", OrdenServicioController.createOrden)

// HU-15 (Criterio 9): Consultar órdenes de servicio registradas
router.get("/", OrdenServicioController.getOrdenes)

// Obtener detalle de orden por ID
router.get("/:id", OrdenServicioController.getOrdenById)

export default router
