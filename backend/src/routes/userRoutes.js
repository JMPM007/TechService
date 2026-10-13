import { Router } from 'express'
import {
  loginUser,
  registerUser,
  listUsers,
  getUser,
  editUser,
  toggleUserStatus,
} from '../controllers/userController.js'
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = Router()

// Rutas públicas
router.post('/', registerUser)
router.post('/login', loginUser)

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