import { Router } from "express"
import { createTechnician, getTechnicians } from "../controllers/technicianController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js";


const router = Router()


router.get("/", verifyToken, authorizeRoles("ADMIN"), getTechnicians);
router.post("/register", verifyToken, authorizeRoles("ADMIN"), createTechnician)


export default router