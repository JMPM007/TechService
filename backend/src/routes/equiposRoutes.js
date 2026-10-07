import { Router } from "express"
import { registrarEquipo, obtenerEquiposCliente } from "../controllers/equiposController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js";

const router = Router()



router.post(
    "/", verifyToken, authorizeRoles("ADMIN", "TECNICO"), registrarEquipo)

router.get(
    "/cliente/:clienteId", verifyToken, authorizeRoles(["ADMIN", "TECNICO", "CLIENTE"]), obtenerEquiposCliente)

export default router

