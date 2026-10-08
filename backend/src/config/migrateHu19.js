import pool from './db.js'

try {
  async function addHistoryColumnIfMissing(columnName, definition) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'historial_estados_orden'
         AND column_name = ?`,
      [columnName],
    )
    if (rows[0].count === 0) {
      await pool.query(`ALTER TABLE historial_estados_orden ADD COLUMN ${columnName} ${definition}`)
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ordenes_servicio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo_orden VARCHAR(30) NULL UNIQUE,
      equipo_id INT NOT NULL,
      tecnico_id INT NULL,
      motivo_ingreso TEXT NULL,
      tipo_servicio VARCHAR(80) NULL,
      prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
      estado ENUM('RECIBIDA', 'PENDIENTE', 'EN_REVISION', 'EN_REPARACION',
        'EN_PROCESO', 'EN_ESPERA_REPUESTO', 'REPARADA', 'COMPLETADO',
        'ENTREGADA', 'CERRADA', 'CANCELADA') NOT NULL DEFAULT 'RECIBIDA',
      costo_estimado DECIMAL(12, 2) NOT NULL DEFAULT 0,
      abono_inicial DECIMAL(12, 2) NOT NULL DEFAULT 0,
      observaciones_recepcion TEXT NULL,
      observaciones_cierre TEXT NULL,
      fecha_asignacion TIMESTAMP NULL,
      fecha_cierre TIMESTAMP NULL,
      creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ordenes_equipo_id (equipo_id),
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE RESTRICT,
      FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS historial_estados_orden (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orden_id INT NOT NULL,
      estado_anterior VARCHAR(30) NULL,
      estado_nuevo VARCHAR(30) NOT NULL,
      usuario_id INT NOT NULL,
      observacion TEXT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
      INDEX idx_historial_orden_fecha (orden_id, creado_en, id)
    )
  `)

  await addHistoryColumnIfMissing('usuario_id', 'INT NULL')
  await addHistoryColumnIfMissing('observacion', 'TEXT NULL')
  await addHistoryColumnIfMissing('creado_en', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')

  const [users] = await pool.query('SELECT MIN(id) AS id FROM usuarios')
  if (users[0].id !== null) {
    await pool.query(
      'UPDATE historial_estados_orden SET usuario_id = ? WHERE usuario_id IS NULL',
      [users[0].id],
    )
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS diagnosticos_orden (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orden_id INT NOT NULL UNIQUE,
      tecnico_id INT NOT NULL,
      descripcion TEXT NOT NULL,
      falla_encontrada TEXT NOT NULL,
      fecha_diagnostico DATETIME NOT NULL,
      recomendaciones TEXT NULL,
      procedimientos TEXT NULL,
      observaciones TEXT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE RESTRICT,
      FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE RESTRICT
    )
  `)

  await pool.query(`
    INSERT INTO historial_estados_orden
      (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
    SELECT o.id, NULL, o.estado, u.id, 'Registro inicial de la orden'
    FROM ordenes_servicio o
    LEFT JOIN historial_estados_orden h ON h.orden_id = o.id
    JOIN (SELECT MIN(id) AS id FROM usuarios) u ON u.id IS NOT NULL
    WHERE h.id IS NULL
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orden_id INT NOT NULL UNIQUE,
      creado_por INT NOT NULL,
      estado ENUM('PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE_APROBACION',
      subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
      total DECIMAL(12, 2) NOT NULL DEFAULT 0,
      creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE RESTRICT,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cotizacion_conceptos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cotizacion_id INT NOT NULL,
      tipo ENUM('SERVICIO', 'MANO_OBRA', 'REPUESTO') NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      cantidad DECIMAL(10, 2) NOT NULL,
      precio_unitario DECIMAL(12, 2) NOT NULL,
      observaciones TEXT NULL,
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
      CHECK (cantidad > 0),
      CHECK (precio_unitario >= 0)
    )
  `)

  console.log('Migracion HU-19 completada.')
} finally {
  await pool.end()
}
