import {createTechnicianBD} from "../models/tecnicoModel.js"

export const createTechnician = async (req, res) => {
    const {usuario_id, cedula, telefono, especialidad} = req.body

    if(!usuario_id || !cedula || !telefono || !especialidad){
        return res.status(400).json({
            error: "Todos los campos son obligatorios"
        })
    }

    try {
        const result = await createTechnicianBD({usuario_id, cedula, telefono, especialidad})

        return res.status(201).json({
            mensaje: "Tecnico registrado exitosamente",
            tecnico_id: result.insertId
        })


    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                mensaje: 'El usuario_id o la cédula ya se encuentran registrados.' 
            });
        }
    }

}