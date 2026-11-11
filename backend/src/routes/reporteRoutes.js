import { Router } from 'express'
import { generarReporteGestion } from '../controllers/reporteController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/gestion', verifyToken, authorizeRoles('ADMIN'), generarReporteGestion)

export default router
