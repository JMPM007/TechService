import pool from "../config/db.js";

export const findUserByEmail = async(email) =>{
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email])
    return rows[0]
}

export const createUserBD = async ({nombre, email, password, rol}) =>{
    const [result] = await pool.query("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?,?,?,?) ",
        [nombre, email, password, rol])
    return result.insertId
}

