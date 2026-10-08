import { Router } from 'express'
import { ClienteController } from '../controllers/clienteController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()
const personalAutorizado = authorizeRoles('ADMIN', 'TECNICO')

router.post('/', verifyToken, personalAutorizado, ClienteController.createCliente)
router.get('/', verifyToken, personalAutorizado, ClienteController.getClientes)
router.get('/tecnicos', verifyToken, personalAutorizado, ClienteController.getTecnicos)
router.get('/cedula/:cedula', verifyToken, personalAutorizado, ClienteController.getClienteByCedula)
router.get('/:id', verifyToken, authorizeRoles('ADMIN', 'TECNICO', 'CLIENTE'), ClienteController.getClienteById)
router.put('/:id', verifyToken, personalAutorizado, ClienteController.updateCliente)

export default router
