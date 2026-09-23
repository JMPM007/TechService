import pool from '../config/db.js'

export async function buscarTecnicoPorUsuario(usuarioId) {
  const [rows] = await pool.query(
    'SELECT id FROM tecnicos WHERE usuario_id = ? LIMIT 1',
    [usuarioId],
  )
  return rows[0] || null
}

export async function existeOrden(ordenId) {
  const [rows] = await pool.query(
    'SELECT id FROM ordenes_servicio WHERE id = ? LIMIT 1',
    [ordenId],
  )
  return rows.length > 0
}

export async function crearDiagnostico({
  ordenId,
  tecnicoId,
  descripcion,
  fallaEncontrada,
  fechaDiagnostico,
  recomendaciones,
  procedimientos,
  observaciones,
}) {
  const [result] = await pool.query(
    `INSERT INTO diagnosticos_orden
      (orden_id, tecnico_id, descripcion, falla_encontrada, fecha_diagnostico,
       recomendaciones, procedimientos, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ordenId,
      tecnicoId,
      descripcion,
      fallaEncontrada,
      fechaDiagnostico,
      recomendaciones || null,
      procedimientos || null,
      observaciones || null,
    ],
  )
  return result.insertId
}

export async function crearOrdenYDiagnostico({
  equipoId,
  tecnicoId,
  descripcion,
  fallaEncontrada,
  fechaDiagnostico,
  recomendaciones,
  procedimientos,
  observaciones,
}) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [ordenResult] = await connection.query(
      'INSERT INTO ordenes_servicio (equipo_id) VALUES (?)',
      [equipoId],
    )
    const ordenId = ordenResult.insertId
    await connection.query(
      `INSERT INTO historial_estados_orden
        (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
       VALUES (?, NULL, 'RECIBIDA', ?, 'Registro inicial de la orden')`,
      [ordenId, tecnicoId],
    )

    const [diagnosticoResult] = await connection.query(
      `INSERT INTO diagnosticos_orden
        (orden_id, tecnico_id, descripcion, falla_encontrada, fecha_diagnostico,
         recomendaciones, procedimientos, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ordenId,
        tecnicoId,
        descripcion,
        fallaEncontrada,
        fechaDiagnostico,
        recomendaciones || null,
        procedimientos || null,
        observaciones || null,
      ],
    )

    await connection.commit()
    return { ordenId, diagnosticoId: diagnosticoResult.insertId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function actualizarDiagnostico(ordenId, datos) {
  await pool.query(
    `UPDATE diagnosticos_orden SET
      descripcion = ?, falla_encontrada = ?, fecha_diagnostico = ?,
      recomendaciones = ?, procedimientos = ?, observaciones = ?
     WHERE orden_id = ?`,
    [
      datos.descripcion,
      datos.fallaEncontrada,
      datos.fechaDiagnostico,
      datos.recomendaciones || null,
      datos.procedimientos || null,
      datos.observaciones || null,
      ordenId,
    ],
  )
}

export async function obtenerDiagnostico(ordenId) {
  const [rows] = await pool.query(
    `SELECT d.id, d.orden_id AS ordenId, d.tecnico_id AS tecnicoId,
      u.nombre AS tecnicoNombre, d.descripcion, d.falla_encontrada AS fallaEncontrada,
      d.fecha_diagnostico AS fechaDiagnostico, d.recomendaciones,
      d.procedimientos, d.observaciones, d.creado_en AS creadoEn,
      d.actualizado_en AS actualizadoEn
     FROM diagnosticos_orden d
     INNER JOIN tecnicos t ON t.id = d.tecnico_id
     INNER JOIN usuarios u ON u.id = t.usuario_id
     WHERE d.orden_id = ?
     LIMIT 1`,
    [ordenId],
  )
  return rows[0] || null
}
