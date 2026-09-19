import mysql from "mysql2/promise"
import process from "node:process"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

dotenv.config()

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 22642,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        ca: fs.readFileSync(path.join(process.cwd(), "ca.pem")),
        rejectUnauthorized: true
    },
    connectTimeout: 10000
})

export default pool