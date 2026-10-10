import { Router } from 'express'
import {
  actualizarEstadoOrden,
  consultarHistorialOrden,
  consultarDiagnostico,
  registrarDiagnostico,
  registrarNuevoDiagnostico,
  actualizarDiagnostico,
  registrarOrden,
  registrarOrdenServicio,
  consultarOrdenServicio,
  consultarOrdenesServicio,
  asignarOrdenATecnico,
  cerrarOrden,
} from '../controllers/ordenController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')
const tecnicoAutorizado = authorizeRoles('TECNICO')

router.post('/', verifyToken, tecnicoAutorizado, registrarOrden)
router.get('/', verifyToken, personalAutorizado, consultarOrdenesServicio)
router.post('/servicio', verifyToken, tecnicoAutorizado, registrarOrdenServicio)
router.patch('/:ordenId/asignar', verifyToken, authorizeRoles('ADMIN'), asignarOrdenATecnico)
router.post('/diagnostico', verifyToken, tecnicoAutorizado, registrarNuevoDiagnostico)
router.patch('/:ordenId/estado', verifyToken, personalAutorizado, actualizarEstadoOrden)
router.patch('/:ordenId/cerrar', verifyToken, personalAutorizado, cerrarOrden)
router.get('/:ordenId/historial', verifyToken, personalAutorizado, consultarHistorialOrden)
router.post('/:ordenId/diagnostico', verifyToken, tecnicoAutorizado, registrarDiagnostico)
router.put('/:ordenId/diagnostico', verifyToken, tecnicoAutorizado, actualizarDiagnostico)
router.get('/:ordenId/diagnostico', verifyToken, personalAutorizado, consultarDiagnostico)
router.get('/:ordenId', verifyToken, personalAutorizado, consultarOrdenServicio)

export default router
