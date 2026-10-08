import { Router } from 'express'
import { EquipoController } from '../controllers/equiposController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')

router.post('/', verifyToken, personalAutorizado, EquipoController.registrarEquipo)
router.get('/', verifyToken, personalAutorizado, EquipoController.listarFichaEquipos)
router.get('/buscar', verifyToken, personalAutorizado, EquipoController.buscarEquipoPorMarcaYSerial)
router.get('/serie/:serie', verifyToken, personalAutorizado, EquipoController.buscarEquipoPorSerialExacto)
router.get('/cliente/:clienteId', verifyToken, authorizeRoles('ADMIN', 'TECNICO', 'CLIENTE'), EquipoController.obtenerEquiposCliente)
router.put('/:equipoId', verifyToken, personalAutorizado, EquipoController.editarFichaEquipo)
router.get('/:equipoId', verifyToken, personalAutorizado, EquipoController.obtenerEquipo)

export default router
