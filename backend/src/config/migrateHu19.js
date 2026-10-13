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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ordenes_servicio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipo_id INT NOT NULL UNIQUE,
      estado ENUM('RECIBIDA', 'EN_REVISION', 'EN_REPARACION', 'REPARADA', 'ENTREGADA', 'CANCELADA') NOT NULL DEFAULT 'RECIBIDA',
      creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE RESTRICT
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
      FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
      INDEX idx_historial_orden_fecha (orden_id, creado_en, id)
    )
  `)

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
    SELECT o.id, NULL, o.estado, 1, 'Registro inicial de la orden'
    FROM ordenes_servicio o
    LEFT JOIN historial_estados_orden h ON h.orden_id = o.id
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
