import { Router } from "express";
import { createUser, loginUser } from "../controllers/userController.js";
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware.js";

const router = Router()

router.post("/", createUser)
router.post("/login", loginUser)


router.get("/perfil", verifyToken, (req, res)=>{
    res.json({
        mensaje: "Acceso concedido a la ruta protegida",
        usuarioAutenticado: req.user
    })
})


router.get("/admin-panel", verifyToken, authorizeRoles("ADMIN"), (req, res) =>{
    res.json({
        mensaje: "Bienvenido al panel exclusivo de administracion"
    })
})
export default router