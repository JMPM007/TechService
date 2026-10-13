import pool from "../config/db.js";
import {
    buscarRepuestoPorNombreYDescripcion,
    insertarRepuesto,
    obtenerRepuestoParaReabastecer,
    obtenerTodosRepuestos,
    sumarStockRepuesto,
} from "../models/repuestosModel.js"

export async function registrarRepuesto(req, res) {
    const {nombre, descripcion, stock, precio_unitario} = req.body

    const nombreLimpio = typeof nombre === "string" ? nombre.trim() : ""
    const descripcionLimpia = typeof descripcion === "string" && descripcion.trim()
        ? descripcion.trim()
        : null
    const stockInicial = stock === undefined ? 0 : Number(stock)
    const precio = Number(precio_unitario)

    if(!nombreLimpio || nombreLimpio.length > 100 ||
        (descripcion !== undefined && descripcion !== null && typeof descripcion !== "string") ||
        precio_unitario === undefined || !Number.isFinite(precio) ||
        !Number.isInteger(stockInicial)){
        return res.status(400).json({
            error: "El nombre, un stock entero y el precio unitario son obligatorios"
        })
    }

    if (precio < 0 || stockInicial < 0){
        return res.status(400).json({
            error: "El precio y el stock no pueden ser negativos"
        })
    }

    try {
        const existente = await buscarRepuestoPorNombreYDescripcion(
            nombreLimpio,
            descripcionLimpia,
        )

        if (existente) {
            return res.status(400).json({
                error: "Ya existe un repuesto idéntico registrado con este nombre y descripción."
            })
        }

        const nuevoId = await insertarRepuesto(
            nombreLimpio,
            descripcionLimpia,
            stockInicial,
            precio,
        )

        return res.status(201).json({
            message: "Repuesto registrado exitosamente en el inventario",
            data:{
                id: nuevoId,
                nombre: nombreLimpio,
                descripcion: descripcionLimpia,
                stock: stockInicial,
                precio_unitario: precio
            }
        })
           
    } catch{
        return res.status(500).json({
            error: "Error interno del servidor al registrar el repuesto"
        })
    }


}

export async function listarRepuestos(req, res) {
    try{
        const repuestos = await obtenerTodosRepuestos()
        return res.status(200).json({
            message: "Inventario obtenido existosamente",
            data: repuestos
        })
    }catch{
        return res.status(500).json({
            error: "Error interno en el servidor al obtener repuestos"
        })
    }
}





export async function ingresarReabastecimiento(req, res) {
    const {repuesto_id, cantidad} = req.body

    if(!Number.isInteger(Number(repuesto_id)) || Number(repuesto_id) <= 0 ||
       !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0){
        return res.status(400).json({
            error: "El ID del repuesto y una cantidad entera mayor que cero son obligatorios"
        })
    }
    

    const conecction = await pool.getConnection()
    

    try{
        await conecction.beginTransaction()

    
        const repuesto = await obtenerRepuestoParaReabastecer(repuesto_id, conecction)
        if(!repuesto){
            await conecction.rollback()
            conecction.release()
            return res.status(400).json({
                error: "El repuesto especificado no existe en el inventario"
            })
        }

        await sumarStockRepuesto(repuesto_id, cantidad, conecction)

        await conecction.commit()
        conecction.release()

        const nuevoStock = repuesto.stock + Number(cantidad)

        return res.status(200).json({
            message: "Reabastecimiento registrado y stock actualizado existosamente",
            data:{
                repuesto_id,
                nombre: repuesto.nombre,
                stock_anterior: repuesto.stock,
                cantidad_agregada: Number(cantidad),
                stock_actual: nuevoStock
            }
        })

    }catch{
        await conecction.rollback()
        conecction.release()
        return res.status(500).json({
            error: "Error interno del servidor al procesar el reabastecimieto"
        })
    }
    
}
