import pool from "../config/db.js";
import {obtenerRepuestoParaReabastecer, sumarStockRepuesto} from "../models/repuestosModel.js"

export async function ingresarReabastecimiento(req, res) {
    const {repuesto_id, cantidad} = req.body

    if(!repuesto_id || !cantidad){
        return res.status(400).json({
            error: "Faltan campos obligatorios: repuesto id y cantidad"
        })
    }

    if(cantidad <= 0){
        return res.status(400).json({
            error: "La cantdiad de reabastecimiento deber ser mayor a 0"
        })
    }
    

    const conecction = await pool.getConnection()
    

    try{
        await conecction.beginTransaction()

    
        const repuesto = await obtenerRepuestoParaReabastecer()
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

