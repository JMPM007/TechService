import { Router } from 'express'
import {
  buscarClientePorCedula,
  consultarClientes,
  registrarCliente,
  eliminarClienteById,
} from '../controllers/clienteController.js'
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/clientes', registrarCliente)
router.get('/clientes', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), consultarClientes)
router.get('/clientes/cedula/:cedula', verifyToken, authorizeRoles('ADMIN', 'TECNICO'), buscarClientePorCedula)

// HU-09: Eliminar cliente — solo ADMIN
router.delete('/clientes/:id', verifyToken, authorizeRoles('ADMIN'), eliminarClienteById)

export default router
