import bcrypt from "bcryptjs"
import { findUserByEmail, createUserBD } from "../models/userModel.js"
import jwt from "jsonwebtoken"
import process from "node:process"


export const loginUser = async (req, res) =>{
    const {email, password} = req.body 

    if(!email || !password){
        return res.status(400).json({
            error: "El sistema requiere correo y contraseña para iniciar sesion"
        })
    }

    try{
        const user = await findUserByEmail(email)
        if(!user){
            return res.status(400).json({
                error: "Credenciales invalidas (correo o contraseña incorrectos)"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({
                error: "Credenciales invalidas (correo o contraseña incorrectos)"
            })
        }

        const token = jwt.sign(
            {id: user.id, rol: user.rol},
            process.env.JWT_SECRET,
            {expiresIn: "8h"}
        )

        return res.status(200).json({
            mensaje: "Inicio de sesion exitoso",
            token,
            usuario:{
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        })
    } catch (error){
        return res.status(500).json({error: error.message})    
    }
}





export const createUser = async (req, res) =>{

    const {nombre, email, password, rol} = req.body

    if(!nombre || !email || !password || !rol){
        return res.status(400).json({
            error: "El sistema requiere nombre, email, contraseña y rol como campos obligatorios"
            
        })
    }

    const allowedRoles = ["ADMIN", "TECNICO", "CLIENTE"]
    if (!allowedRoles.includes(rol.trim().toUpperCase())){
        return res.status(400).json({
            error : "El sistema no permite crear usuarios sin un rol valido (ADMIN, TECNICO, CLIENTE)"
        })
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if(!passwordRegex.test(password)){
        return res.status(400).json({
            error: "El sistema requiere una contraseña de al menos 8 caracteres con letras, numeros y caracteres especiales "
        })
    }

    try {
        const userExists = await findUserByEmail(email)
        if(userExists){
            return res.status(400).json({
                error: "El sistema detecto que el correo electronico ya se encuentra registrado"
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const id = await createUserBD({
            nombre, 
            email, 
            password: hashedPassword, 
            rol: rol.toUpperCase()
        })

        return res.status(201).json({
            mensaje: "El sistema registro el usuario exitosamente",
            usuario: {id, nombre, email, rol: rol.toUpperCase()}
        })

    } catch (error) {
            return res.status(500).json({error: error.message})

    }

}

