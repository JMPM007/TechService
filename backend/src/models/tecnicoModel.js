import pool from "../config/db.js"

export const createTechnicianBD = async ({usuario_id, cedula, telefono, especialidad}) => {
    const [result] = await pool.query("INSERT INTO tecnicos (usuario_id, cedula, telefono, especialidad) VALUES (?,?,?,?)",
        [usuario_id, cedula, telefono, especialidad ])
    return result
}

