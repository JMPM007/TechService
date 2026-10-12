import pool from "../config/db.js";

export async function buscarRepuestoPorNombreYDescripcion(nombre, descripcion, connection = pool) {
    const [rows] = await connection.query(
        `SELECT id FROM repuestos
         WHERE LOWER(nombre) = LOWER(?)
         AND (LOWER(descripcion) = LOWER(?) OR (descripcion IS NULL AND ? IS NULL))`,
        [nombre, descripcion, descripcion]
    )
    return rows[0]
}

export async function insertarRepuesto(nombre, descripcion, stock, precio_unitario, connection = pool) {
    const [result] = await connection.query(
        'INSERT INTO repuestos (nombre, descripcion, stock, precio_unitario) VALUES (?, ?, ?, ?)',
        [nombre, descripcion, stock || 0, precio_unitario]
    )
    return result.insertId
}

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

export async function obtenerTodosRepuestos(connection = pool) {
    const [rows] = await connection.query(
        'SELECT id, nombre, descripcion, stock, precio_unitario FROM repuestos ORDER BY id ASC'
    )
    return rows
}