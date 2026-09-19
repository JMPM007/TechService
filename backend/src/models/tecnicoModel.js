import pool from "../config/db.js"

export const findTechnicianByCedula = async(cedula) =>{
    const [rows] = await pool.query("SELECT * FROM tecnicos WHERE cedula = ?", [cedula])
    return rows[0]
}

export const findTechnicianByTelefono = async (telefono) => {
  const [rows] = await pool.query(
    "SELECT * FROM tecnicos WHERE telefono = ?",
    [telefono]
  );
  return rows[0];
};


export const createTechnicianBD = async ({usuario_id, cedula, telefono, especialidad}) => {
    const [result] = await pool.query("INSERT INTO tecnicos (usuario_id, cedula, telefono, especialidad) VALUES (?,?,?,?)",
        [usuario_id, cedula, telefono, especialidad, "DISPONIBLE"])
    return result
}


export const getAllTechniciansBD = async () => {
    const query = `
        SELECT 
        t.id AS tecnico_id,
        u.id AS usuario_id,
        u.nombre,
        u.email,
        t.cedula,
        t.telefono,
        t.especialidad,
        t.estado
        FROM tecnicos t
        INNER JOIN usuarios u ON t.usuario_id = u.id
        ORDER BY u.nombre ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
};

