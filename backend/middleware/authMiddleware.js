import jwt from "jsonwebtoken"
import process from "node:process"


export const verifyToken = (req, res, next) =>{
    const authHeader = req.headers["autorizacion"]
    const token = authHeader && authHeader.split(" ")[1]

    if(!token){
        return res.status(401).json({
            error: "Acceso denegado. No se proporciono un token de autenticacion"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()
    } catch {
        return res.status(403).json({
            error: "Token invalido o expirado. Por favor, inicie sesion nuevamente"
        })
    }

}


export const authorizeRoles = (...rolesPermitidos) =>{
    return (req, res, next) =>{
        if (!req.user || !rolesPermitidos.includes(req.user.rol)){
            return res.status(403).json({
                error: "Acceso prohibido. No tienes permisos para realizar esta accion"
            })
        }
        next()
    }
}