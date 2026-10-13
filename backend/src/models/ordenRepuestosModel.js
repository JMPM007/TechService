import pool from "../config/db.js";

export async function obtenerOrdenPorId(ordenId, connection = pool) {
    const [rows] = await connection.query('SELECT id, codigo_orden, estado FROM ordenes_servicio WHERE id = ?',
    [ordenId]
    )
    return rows[0]
}

export async function obtenerRepuestoConBloqueo(repuestoId, connection = pool) {
    const [rows] = await connection.query('SELECT id, nombre, stock, precio_unitario FROM repuestos WHERE id = ? FOR UPDATE',
        [repuestoId]
    )
    return rows[0]
}

export async function insertarRepuestoEnOrden({orden_id, repuesto_id, cantidad, precio_unitario, subtotal}, connection = pool) {
    const [result] = await connection.query('INSERT INTO orden_repuestos (orden_id, repuesto_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?)',
        [orden_id, repuesto_id, cantidad, precio_unitario, subtotal]
    )
    return result
}

export async function descontarStockRepuesto(repuestoId, cantidad, connection = pool) {
    const [result] = await connection.query('UPDATE repuestos SET stock = stock - ? WHERE id = ?',
        [cantidad, repuestoId]
    )
    return result
}
