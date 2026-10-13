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
    CREATE TABLE IF NOT EXISTS cotizacion_decisiones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cotizacion_id INT NOT NULL,
      estado ENUM('APROBADA', 'RECHAZADA') NOT NULL,
      usuario_id INT NOT NULL,
      registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
      INDEX idx_decisiones_cotizacion_fecha (cotizacion_id, registrado_en, id)
    )
  `)
  console.log('Migracion HU-22 completada.')
} finally {
  await pool.end()
}