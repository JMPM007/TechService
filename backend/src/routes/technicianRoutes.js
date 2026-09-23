import { Router } from 'express'
import { getTechnicians, registerTechnician, updateTechnicianStatus } from '../controllers/technicianController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verifyToken, authorizeRoles('ADMIN'), getTechnicians)
router.patch('/:id/estado', verifyToken, authorizeRoles('ADMIN'), updateTechnicianStatus)
router.post('/register', verifyToken, authorizeRoles('ADMIN'), registerTechnician)

export default router
