import { Router } from "express"
import { createClientesController } from "../controllers/clientes.js"

export function createClientesRouter(database) {
    const router = Router()
    const controller = createClientesController(database)

    router.post("/", controller.create)
    router.get("/", controller.list)
    router.put("/:id", controller.update)

    return router
}