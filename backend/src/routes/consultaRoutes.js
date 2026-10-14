import { Router } from 'express'
import {
    buscarGlobal,
    consultarDashboardOrdenes,
    consultarOrdenPorCodigo,
} from '../controllers/consultaController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')

router.get('/ordenes/:codigo', verifyToken, authorizeRoles('CLIENTE'), consultarOrdenPorCodigo)
router.get('/dashboard', verifyToken, personalAutorizado, consultarDashboardOrdenes)
router.get('/buscar', verifyToken, personalAutorizado, buscarGlobal)

export default router