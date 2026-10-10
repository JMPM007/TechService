import pool from "../config/db.js"

export async function buscarOrdenPorId(id) {
    const [rows] = await pool.query("SELECT * FROM ordenes WHERE id = ?", [id])
    return rows[0] || null
}

export async function buscarTecnicoPorId(id) {
    const [rows] = await pool.query(
        "SELECT * FROM usuarios WHERE id = ? AND rol = 'TECNICO'",
        [id]
    )
    return rows[0] || null
}

export async function asignarTecnicoAOrden(ordenId, tecnicoId) {
    await pool.query(
        `UPDATE ordenes
            SET tecnico_id = ?, estado = 'Asignada', fecha_asignacion = NOW()
            WHERE id = ?`,
        [tecnicoId, ordenId]
    )
    return buscarOrdenPorId(ordenId)
}

export async function registrarCambioEstado(ordenId, estadoAnterior, estadoNuevo) {
    await pool.query(
        `INSERT INTO historial_estados_orden (orden_id, estado_anterior, estado_nuevo)
            VALUES (?, ?, ?)`,
        [ordenId, estadoAnterior, estadoNuevo]
    )
}

export async function actualizarEstadoOrden(ordenId, nuevoEstado) {
    await pool.query(
        "UPDATE ordenes SET estado = ? WHERE id = ?",
        [nuevoEstado, ordenId]
    )
    return buscarOrdenPorId(ordenId)
}

export async function cerrarOrdenDefinitivamente(ordenId, observaciones) {
    await pool.query(
        `UPDATE ordenes
        SET estado = 'Cerrada', observaciones_cierre = ?, fecha_cierre = NOW()
        WHERE id = ?`,
        [observaciones, ordenId]
    )
    return buscarOrdenPorId(ordenId)
}

export async function listarOrdenes() {
    const [rows] = await pool.query(
        `SELECT o.*, c.nombres AS cliente_nombres, c.apellidos AS cliente_apellidos,
                u.nombre AS tecnico_nombre
            FROM ordenes o
            JOIN clientes c ON c.id = o.cliente_id
            LEFT JOIN usuarios u ON u.id = o.tecnico_id
            ORDER BY o.id DESC`
    )
    return rows
}