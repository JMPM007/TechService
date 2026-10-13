import { Router } from 'express'
import {
  cambiarEstadoCotizacion,
  consultarCotizacion,
  editarConceptosCotizacion,
  registrarCotizacion,
} from '../controllers/cotizacionController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')
const usuariosAutorizados = authorizeRoles('ADMIN', 'TECNICO', 'CLIENTE')

router.post('/:ordenId/cotizacion', verifyToken, personalAutorizado, registrarCotizacion)
router.put('/:ordenId/cotizacion/conceptos', verifyToken, personalAutorizado, editarConceptosCotizacion)
router.patch('/:ordenId/cotizacion/estado', verifyToken, personalAutorizado, cambiarEstadoCotizacion)
router.get('/:ordenId/cotizacion', verifyToken, usuariosAutorizados, consultarCotizacion)

export default router
