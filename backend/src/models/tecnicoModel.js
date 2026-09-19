import pool from "../config/db.js"

export const findTechnicianByCedula = async(cedula) =>{
    const [rows] = await pool.query("SELECT * FROM tecnicos WHERE cedula = ?", [cedula])
    return rows[0]
}


export const createTechnicianBD = async ({usuario_id, cedula, telefono, especialidad}) => {
    const [result] = await pool.query("INSERT INTO tecnicos (usuario_id, cedula, telefono, especialidad) VALUES (?,?,?,?)",
        [usuario_id, cedula, telefono, especialidad, "DISPONIBLE"])
    return result
}

