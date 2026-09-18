import pool from "../config/db.js"

export const createTechnician = async (usuario_id, nombre, cedula, telefono, especialidad, estado = "DISPONIBLE") => {
    const [result] = await pool.query("INSERT INTO tecnicos (usuario_id, nombre, cedula, telefono, especialidad, estado) VALUES (?,?,?,?,?,?)",
        [usuario_id, nombre, cedula, telefono, especialidad, estado])
    return result
}