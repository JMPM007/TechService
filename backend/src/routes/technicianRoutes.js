import { Router } from 'express'
import {
  getTechnicians,
  registerTechnician,
  updateTechnicianStatus,
} from '../controllers/technicianController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const adminOnly = [verifyToken, authorizeRoles('ADMIN')]

router.get('/', ...adminOnly, getTechnicians)
router.patch('/:id/estado', ...adminOnly, updateTechnicianStatus)
router.post('/register', ...adminOnly, registerTechnician)

export default router
