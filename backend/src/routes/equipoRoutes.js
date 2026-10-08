import { Router } from "express"
import { EquipoController } from "../controllers/equipoController.js"

const router = Router()

// HU-13: Listar y buscar equipos
router.get("/", EquipoController.getEquipos)

// HU-13: Buscar directamente por número de serie
router.get("/serie/:serie", EquipoController.getEquipoBySerie)

// HU-13: Consultar ficha técnica y propiedades de un equipo
router.get("/:id", EquipoController.getEquipoById)

// HU-14: Editar características de un equipo
router.put("/:id", EquipoController.updateEquipo)

// Registrar un nuevo equipo
router.post("/", EquipoController.createEquipo)

export default router
