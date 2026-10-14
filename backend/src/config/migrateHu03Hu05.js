/**
 * Migración HU-03 / HU-05
 * Agrega el campo `activo` a la tabla `usuarios` si no existe.
 * El campo permite baja lógica sin eliminar el registro.
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
  // Verificar si ya existe la columna 'activo' en usuarios
  const [cols] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'usuarios' AND column_name = 'activo'`,
  )

  if (cols[0].count === 0) {
    await pool.query(
      `ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1
       COMMENT '1 = activo, 0 = baja lógica'`,
    )
    console.log('✅ Columna activo agregada a la tabla usuarios.')
  } else {
    console.log('ℹ️  La columna activo ya existe en usuarios. Sin cambios.')
  }

  console.log('✅ Migración HU-03/HU-05 completada.')
} finally {
  await pool.end()
}
