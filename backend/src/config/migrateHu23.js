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
    CREATE TABLE IF NOT EXISTS servicios_mano_obra (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orden_id INT NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      costo DECIMAL(12, 2) NOT NULL,
      tiempo_minutos INT NULL,
      registrado_por INT NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE RESTRICT,
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
      CHECK (costo >= 0),
      CHECK (tiempo_minutos IS NULL OR tiempo_minutos > 0),
      INDEX idx_mano_obra_orden (orden_id, id)
    )
  `)
  console.log('Migracion HU-23 completada.')
} finally {
  await pool.end()
}