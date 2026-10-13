import { Router } from 'express'
import {
  cambiarEstadoCotizacion,
  consultarCotizacion,
  editarConceptosCotizacion,
  registrarDecision,
  registrarCotizacion,
} from '../controllers/cotizacionController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')
const usuariosAutorizados = authorizeRoles('ADMIN', 'TECNICO', 'CLIENTE')

router.post('/:ordenId/cotizacion', verifyToken, personalAutorizado, registrarCotizacion)
router.put('/:ordenId/cotizacion/conceptos', verifyToken, personalAutorizado, editarConceptosCotizacion)
router.patch('/:ordenId/cotizacion/estado', verifyToken, authorizeRoles('ADMIN'), cambiarEstadoCotizacion)
router.patch('/:ordenId/cotizacion/decision', verifyToken, authorizeRoles('CLIENTE'), registrarDecision)
router.get('/:ordenId/cotizacion', verifyToken, usuariosAutorizados, consultarCotizacion)

export default router
