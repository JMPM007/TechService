import pool from "../config/db.js";

export async function crearEquipoBD({cliente_id, tipo, marca, modelo, numero_serie, motivo_ingreso }){
    const [result] = await pool.query(
        'INSERT INTO equipos (cliente_id, tipo, marca, modelo, numero_serie, motivo_ingreso) VALUES(?,?,?,?,?,?)',
        [cliente_id, tipo, marca, modelo, numero_serie || null, motivo_ingreso]
    )
    return result.insertId
}

export async function obtenerEquiposPorClienteBD(cliente_id) {
    const [rows] = await pool.query(
        "SELECT * FROM equipos WHERE  cliente_id = ? ORDER BY fecha_ingreso DESC",
        [cliente_id]
    )

    return rows
    
}


