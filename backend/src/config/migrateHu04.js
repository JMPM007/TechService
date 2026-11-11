/**
 * Migración HU-04
 * Crea la tabla de tokens de recuperación de contraseña.
 * Solo se guarda el hash SHA-256 del token; el token en claro viaja únicamente en el correo.
 */
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import process from 'node:process'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expira_en DATETIME NOT NULL,
      usado_en DATETIME NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_reset_usuario (usuario_id, creado_en),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `)
  console.log('✅ Migración HU-04 completada.')
} finally {
  await pool.end()
}
