import {
    buscarOrdenPorId,
    buscarTecnicoPorId,
    asignarTecnicoAOrden,
    actualizarEstadoOrden,
    cerrarOrdenDefinitivamente,
    registrarCambioEstado,
    listarOrdenes
} from "../models/ordenModel.js"

export async function asignarOrden(req, res) {
    try {
        const { id } = req.params
        const { tecnicoId } = req.body

        if (!tecnicoId) {
            return res.status(400).json({ error: "Debe indicar el id del técnico (tecnicoId)" })
        }

        // 1. Verificar que la orden exista
        const orden = await buscarOrdenPorId(id)
        if (!orden) {
            return res.status(404).json({ error: "La orden indicada no existe" })
        }

        // 2. Impedir reasignar una orden cerrada
        if (orden.estado === "Cerrada") {
            return res.status(409).json({ error: "No se puede asignar una orden que ya está cerrada" })
        }

        // 3. Verificar que el técnico exista y tenga el rol correcto
        const tecnico = await buscarTecnicoPorId(tecnicoId)
        if (!tecnico) {
            return res.status(404).json({ error: "El técnico indicado no existe o no tiene el rol TECNICO" })
        }

        // 4. Asignar y actualizar estado (con fecha de asignación)
        const estadoAnterior = orden.estado
        const ordenActualizada = await asignarTecnicoAOrden(id, tecnicoId)
        await registrarCambioEstado(id, estadoAnterior, "Asignada")

        return res.status(200).json({
            mensaje: "Orden asignada exitosamente",
            orden: ordenActualizada
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

const ESTADOS_VALIDOS = ["Registrada", "Asignada", "En proceso", "Finalizada", "Cerrada"]

export async function actualizarEstado(req, res) {
    try {
        const { id } = req.params
        const { estado, tecnicoId } = req.body

        if (!estado) {
            return res.status(400).json({ error: "Debe indicar el nuevo estado" })
        }

        if (!ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                error: "Estado no válido",
                estadosPermitidos: ESTADOS_VALIDOS
            })
        }

        // 1. Verificar que la orden exista
        const orden = await buscarOrdenPorId(id)
        if (!orden) {
            return res.status(404).json({ error: "La orden indicada no existe" })
        }

        // 2. Impedir modificar una orden ya cerrada
        if (orden.estado === "Cerrada") {
            return res.status(409).json({ error: "No se puede modificar una orden que ya está cerrada" })
        }

        // 3. Impedir que un técnico actualice una orden que no le fue asignada
        if (tecnicoId && orden.tecnico_id !== Number(tecnicoId)) {
            return res.status(403).json({ error: "Este técnico no tiene asignada esta orden" })
        }

        // 4. Actualizar y registrar en historial
        const estadoAnterior = orden.estado
        const ordenActualizada = await actualizarEstadoOrden(id, estado)
        await registrarCambioEstado(id, estadoAnterior, estado)

        return res.status(200).json({
            mensaje: "Estado de la orden actualizado exitosamente",
            orden: ordenActualizada
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

export async function cerrarOrden(req, res) {
    try {
        const { id } = req.params
        const { observaciones } = req.body

        if (!observaciones || observaciones.trim() === "") {
            return res.status(400).json({ error: "Debe indicar las observaciones finales del cierre" })
        }

        // 1. Verificar que la orden exista
        const orden = await buscarOrdenPorId(id)
        if (!orden) {
            return res.status(404).json({ error: "La orden indicada no existe" })
        }

        // 2. Impedir cerrar una orden ya cerrada
        if (orden.estado === "Cerrada") {
            return res.status(409).json({ error: "Esta orden ya se encuentra cerrada" })
        }

        // 3. Exigir que esté en estado "Finalizada"
        if (orden.estado !== "Finalizada") {
            return res.status(409).json({
                error: `Solo se pueden cerrar órdenes en estado "Finalizada". Estado actual: "${orden.estado}"`
            })
        }

        // 4. Cerrar y registrar en historial
        const ordenCerrada = await cerrarOrdenDefinitivamente(id, observaciones)
        await registrarCambioEstado(id, "Finalizada", "Cerrada")

        return res.status(200).json({
            mensaje: "Orden cerrada exitosamente",
            orden: ordenCerrada
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

export async function obtenerOrdenes(req, res) {
    try {
        const ordenes = await listarOrdenes()
        return res.status(200).json({ ordenes })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}