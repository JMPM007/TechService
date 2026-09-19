import { Router } from "express"
import { createTechnician } from "../controllers/technicianController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js";


const router = Router()

router.post("/register", verifyToken, authorizeRoles("ADMIN"), createTechnician)

export default router