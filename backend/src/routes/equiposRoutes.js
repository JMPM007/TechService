import { Router } from 'express'
import {
	buscarEquipoPorMarcaYSerial,
	buscarEquipoPorSerialExacto,
	editarFichaEquipo,
	listarFichaEquipos,
	obtenerEquipo,
	registrarEquipo,
	obtenerEquiposCliente,
} from '../controllers/equiposController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), registrarEquipo)
router.get('/', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), listarFichaEquipos)
router.get('/cliente/:clienteId', verifyToken, authorizeRoles('ADMIN', 'TECNICO', 'CLIENTE'), obtenerEquiposCliente)
router.get('/buscar', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), buscarEquipoPorMarcaYSerial)
router.get('/serie/:serie', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), buscarEquipoPorSerialExacto)
router.put('/:equipoId', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), editarFichaEquipo)
router.get('/:equipoId', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), obtenerEquipo)

export default router
