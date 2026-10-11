import pool from "../config/db.js";

export async function obtenerRepuestoParaReabastecer(repuestoId, conecction = pool){
    const [rows] = await conecction.query(
        'SELECT id, nombre, stock, precio_unitario FROM repuestos WHERE id = ? FOR UPDATE',
        [repuestoId]
    )
    return rows[0]
}

export async function sumarStockRepuesto(repuestoId, cantidad, conecction = pool) {
    const [result] = await conecction.query(
        'UPDATE repuestos SET stock = stock + ? WHERE id = ?',
        [cantidad, repuestoId]
    )
    return result
}