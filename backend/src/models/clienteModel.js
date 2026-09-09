import pool from "../config/db.js"

export async function buscarClientePorCedulaOEmail(cedula, email) {
    const [rows] = await pool.query(
        "SELECT * FROM clientes WHERE cedula = ? OR email = ? LIMIT 1",
        [cedula, email]
    )
    return rows[0] || null
}

export async function crearCliente({ cedula, nombres, apellidos, telefono, email }) {
    const [result] = await pool.query(
        "INSERT INTO clientes (cedula, nombres, apellidos, telefono, email) VALUES (?, ?, ?, ?, ?)",
        [cedula, nombres, apellidos, telefono, email]
    )
    return { id: result.insertId, cedula, nombres, apellidos, telefono, email }
}