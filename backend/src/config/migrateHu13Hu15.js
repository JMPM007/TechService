import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import process from 'node:process'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false },
})

try {
  async function addColumnIfMissing(tableName, columnName, definition) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [tableName, columnName],
    )
    if (rows[0].count === 0) {
      await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
    }
  }

  const equipmentColumns = {
    procesador: 'VARCHAR(100) NULL',
    memoria_ram: 'VARCHAR(50) NULL',
    almacenamiento: 'VARCHAR(100) NULL',
    tarjeta_grafica: 'VARCHAR(100) NULL',
    sistema_operativo: 'VARCHAR(100) NULL',
    estado_fisico: 'TEXT NULL',
    accesorios: 'TEXT NULL',
    observaciones: 'TEXT NULL',
    actualizado_en: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  }
  const orderColumns = {
    codigo_orden: 'VARCHAR(30) NULL UNIQUE',
    tecnico_id: 'INT NULL',
    motivo_ingreso: 'TEXT NULL',
    tipo_servicio: 'VARCHAR(80) NULL',
    prioridad: "VARCHAR(20) NOT NULL DEFAULT 'MEDIA'",
    costo_estimado: 'DECIMAL(12, 2) NOT NULL DEFAULT 0',
    abono_inicial: 'DECIMAL(12, 2) NOT NULL DEFAULT 0',
    observaciones_recepcion: 'TEXT NULL',
    actualizada_en: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  }

  for (const [name, definition] of Object.entries(equipmentColumns)) {
    await addColumnIfMissing('equipos', name, definition)
  }
  for (const [name, definition] of Object.entries(orderColumns)) {
    await addColumnIfMissing('ordenes_servicio', name, definition)
  }

  await pool.query('ALTER TABLE equipos MODIFY COLUMN motivo_ingreso TEXT NULL')

  await pool.query(`
    ALTER TABLE ordenes_servicio MODIFY COLUMN estado
    ENUM('RECIBIDA', 'PENDIENTE', 'EN_REVISION', 'EN_REPARACION', 'EN_PROCESO',
      'EN_ESPERA_REPUESTO', 'REPARADA', 'COMPLETADO', 'ENTREGADA', 'CANCELADA')
    NOT NULL DEFAULT 'RECIBIDA'
  `)

  const [uniqueIndexes] = await pool.query(
    `SELECT DISTINCT s.INDEX_NAME AS indexName
     FROM information_schema.statistics s
     WHERE s.TABLE_SCHEMA = DATABASE()
       AND s.TABLE_NAME = 'ordenes_servicio'
       AND s.COLUMN_NAME = 'equipo_id'
       AND s.NON_UNIQUE = 0
       AND s.INDEX_NAME <> 'PRIMARY'`,
  )

  const [replacementIndexes] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_servicio'
       AND INDEX_NAME = 'idx_ordenes_equipo_id'`,
  )
  if (replacementIndexes[0].count === 0) {
    await pool.query('ALTER TABLE ordenes_servicio ADD INDEX idx_ordenes_equipo_id (equipo_id)')
  }

  for (const index of uniqueIndexes) {
    await pool.query(`ALTER TABLE ordenes_servicio DROP INDEX \`${index.indexName}\``)
  }
  console.log('Migracion HU-13/HU-14/HU-15 completada.')
} finally {
  await pool.end()
}