import { Router } from 'express'
import { loginUser, registerUser } from '../controllers/userController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/', registerUser)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/perfil', verifyToken, (req, res) => {
  return res.json({
    mensaje: 'Acceso concedido a la ruta protegida.',
    usuarioAutenticado: req.user,
  })
})
router.get('/admin-panel', verifyToken, authorizeRoles('ADMIN'), (req, res) => {
  return res.json({ mensaje: 'Bienvenido al panel exclusivo de administración.' })
})

export default router
