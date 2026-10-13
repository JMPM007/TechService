import pool from "../config/db.js";
import {
    descontarStockRepuesto,
    insertarRepuestoEnOrden,
    obtenerOrdenPorId,
    obtenerRepuestoConBloqueo,
} from "../models/ordenRepuestosModel.js";

export async function agregarRepuestoAOrden(req, res) {
    const {orden_id, repuesto_id, cantidad} = req.body

    if(!orden_id || !repuesto_id || !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0){
        return res.status(400).json({
            error: "Orden, repuesto y una cantidad entera mayor que cero son obligatorios"
        })
    }

    const cantidadSolicitada = Number(cantidad)
    const connection = await pool.getConnection()
    let transactionStarted = false

    try {
        await connection.beginTransaction()
        transactionStarted = true

        const orden = await obtenerOrdenPorId(orden_id, connection)
        if(!orden){
            await connection.rollback()
            transactionStarted = false
            return res.status(404).json({
                error: "La orden de servicio especificado no existe"
            })
        }

        const repuesto = await obtenerRepuestoConBloqueo(repuesto_id, connection)
        if(!repuesto){
            await connection.rollback()
            transactionStarted = false
            return res.status(404).json({
                error: "El repuesto especificado no existe"
            })
        }

        if (repuesto.stock < cantidadSolicitada) {
            await connection.rollback()
            transactionStarted = false
            return res.status(409).json({
                error: `Stock insuficiente. Stock actual disponible: ${repuesto.stock}, cantidad solicitada: ${cantidadSolicitada}`
            })
        }

        const precio_unitario = repuesto.precio_unitario
        const subtotal = precio_unitario * cantidadSolicitada

        const resultadoInsercion = await insertarRepuestoEnOrden({
            orden_id, 
            repuesto_id,
            cantidad: cantidadSolicitada,
            precio_unitario,
            subtotal, 
        }, connection)
        await descontarStockRepuesto(repuesto_id, cantidadSolicitada, connection)

        await connection.commit()
        transactionStarted = false

        return res.status(201).json({
            message: "Repuesto agregado a la orden y stock descontado exitosamente",
            data:{
                id: resultadoInsercion.insertId,
                orden_id,
                repuesto_id,
                cantidad: cantidadSolicitada, 
                precio_unitario, 
                subtotal
            }
        })

    } catch (error) {
        if (transactionStarted) await connection.rollback()
        console.error("Error al agregar el repuesto a la orden:", error)
        return res.status(500).json({
            error: "Error interno del servidor al procesar el repuesto en la orden"
        })
    } finally {
        connection.release()
    }

}