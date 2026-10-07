import { Router } from "express"
import { createTechnician, getTechnicians, updateTechnicianStatus } from "../controllers/technicianController.js"
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js";


const router = Router()


router.get("/", verifyToken, authorizeRoles("ADMIN"), getTechnicians);
router.patch("/:id/estado", verifyToken, authorizeRoles("ADMIN"), updateTechnicianStatus);
router.post("/register", verifyToken, authorizeRoles("ADMIN"), createTechnician)


export default router