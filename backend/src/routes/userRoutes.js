import { Router } from 'express'
import {
  loginUser,
  registerUser,
  listUsers,
  getUser,
  editUser,
  toggleUserStatus,
} from '../controllers/userController.js'
import {
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
} from '../controllers/passwordResetController.js'
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = Router()

// Rutas públicas
router.post('/', registerUser)
router.post('/login', loginUser)

// Recuperación de contraseña (HU-04)
router.post('/recuperar-contrasena', requestPasswordReset)
router.get('/restablecer-contrasena/:token', verifyResetToken)
router.post('/restablecer-contrasena', resetPassword)

// Rutas de administración — solo ADMIN
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  listUsers,
)

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  getUser,
)

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  editUser,
)

router.patch(
  '/:id/estado',
  authenticateToken,
  authorizeRoles('ADMIN'),
  toggleUserStatus,
)

export default router