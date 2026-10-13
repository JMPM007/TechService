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
    CREATE TABLE IF NOT EXISTS comprobantes_recepcion (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orden_id INT NOT NULL UNIQUE,
      numero_comprobante VARCHAR(40) NOT NULL UNIQUE,
      generado_por INT NOT NULL,
      falla_reportada TEXT NOT NULL,
      estado_fisico TEXT NOT NULL,
      accesorios TEXT NOT NULL,
      observaciones TEXT NULL,
      fecha_recepcion TIMESTAMP NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE RESTRICT,
      FOREIGN KEY (generado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
    )
  `)
  console.log('Migracion HU-28 completada.')
} finally {
  await pool.end()
}