import bcrypt from "bcryptjs"
import {createTechnicianBD, findTechnicianByCedula, findTechnicianByTelefono, getAllTechniciansBD} from "../models/tecnicoModel.js"
import { findUserByEmail, createUserBD } from "../models/userModel.js"

export const createTechnician = async (req, res) => {
    const {nombre, email, password, cedula, telefono, especialidad} = req.body

    if(!nombre || !email || !password || !cedula || !telefono || !especialidad){
        return res.status(400).json({
            error: "Todos los campos son obligatorios"
        })
    }

    try {
        const userExists = await findUserByEmail(email)
        if(userExists){
            return res.status(400).json({
                error:"El correo ya se encuentra registrado"
            })
        }

        const telefonoExists = await findTechnicianByTelefono(telefono);
        if (telefonoExists) {
            return res.status(400).json({
                error: "El número de teléfono ya se encuentra registrado con otro técnico."
            });
        }


        const cedulaExist = await findTechnicianByCedula(cedula)

        if(cedulaExist){
            return res.status(400).json({
                error: "La cedula ya se encuentra registrada"
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const usuario_id = await createUserBD({
            nombre,
            email,
            password: hashedPassword,
            rol: "TECNICO"
        })

        const result = await createTechnicianBD({usuario_id, cedula, telefono, especialidad})

        return res.status(201).json({
            mensaje: "Tecnico registrado exitosamente",
            usuario_id,
            tecnico_id: result.insertId
        })


    } catch (error) {
        return res.status(500).json({error: "Error en el servidor" + error.message})
    }

}

export const getTechnicians = async (req, res) => {
    try {
        const tecnicos = await getAllTechniciansBD();
        return res.status(200).json(tecnicos);
    } catch (error) {
        return res.status(500).json({
            error: "Error al obtener la lista de técnicos: " + error.message
        });
    }
};