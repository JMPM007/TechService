import { Router } from 'express'
import {
  consultarComprobante,
  consultarOrdenParaComprobante,
  generarComprobante,
} from '../controllers/comprobanteRecepcionController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')
const usuariosAutorizados = authorizeRoles('ADMIN', 'TECNICO', 'CLIENTE')

router.get('/:ordenId/recepcion/datos', verifyToken, personalAutorizado, consultarOrdenParaComprobante)
router.post('/:ordenId/recepcion/comprobante', verifyToken, personalAutorizado, generarComprobante)
router.get('/:ordenId/recepcion/comprobante', verifyToken, usuariosAutorizados, consultarComprobante)

export default router