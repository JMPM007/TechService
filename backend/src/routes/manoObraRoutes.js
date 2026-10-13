import { Router } from 'express'
import {
  borrarManoObra,
  editarManoObra,
  listarManoObra,
  registrarManoObra,
} from '../controllers/manoObraController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')

router.get('/:ordenId/mano-obra', verifyToken, personalAutorizado, listarManoObra)
router.post('/:ordenId/mano-obra', verifyToken, personalAutorizado, registrarManoObra)
router.put('/:ordenId/mano-obra/:servicioId', verifyToken, personalAutorizado, editarManoObra)
router.delete('/:ordenId/mano-obra/:servicioId', verifyToken, personalAutorizado, borrarManoObra)

export default router