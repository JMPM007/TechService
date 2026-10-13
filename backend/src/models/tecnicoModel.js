import pool from '../config/db.js'

export async function findTechnicianByCedula(cedula) {
  const [rows] = await pool.query('SELECT * FROM tecnicos WHERE cedula = ?', [cedula])
  return rows[0]
}

export async function findTechnicianByTelefono(telefono) {
  const [rows] = await pool.query('SELECT * FROM tecnicos WHERE telefono = ?', [telefono])
  return rows[0]
}

export async function createTechnician({ usuario_id, cedula, telefono, especialidad }) {
  const [result] = await pool.query(
    'INSERT INTO tecnicos (usuario_id, cedula, telefono, especialidad) VALUES (?, ?, ?, ?)',
    [usuario_id, cedula, telefono, especialidad],
  )
  return result
}

export async function getAllTechnicians() {
  const [rows] = await pool.query(`
    SELECT t.id AS tecnico_id, u.id AS usuario_id, u.nombre, u.email,
      t.cedula, t.telefono, t.especialidad, t.estado
    FROM tecnicos t
    INNER JOIN usuarios u ON t.usuario_id = u.id
    ORDER BY u.nombre ASC
  `)
  return rows
}

export async function updateTechnicianStatus(tecnicoId, estado) {
  const [result] = await pool.query('UPDATE tecnicos SET estado = ? WHERE id = ?', [estado, tecnicoId])
  return result
}
