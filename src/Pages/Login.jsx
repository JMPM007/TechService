import { useState } from "react";
import { registerUser } from "../services/authService";

export function Register(){
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        password: "",
        rol:"CLIENTE"
    })


    const {mensaje, setMensaje} = useState("")

    const handleChange = (e) =>{
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const handleSubmit = async (e) =>{
        e.preventDefault()
        const res = await registerUser(formData)
        if(res.error){
            setMensaje(`Error: ${res.error}`)
        }else{
            setMensaje(`Usuario registrado exitosamente.`)
        }
    }

    return(
        <div className="register-container">
            <h2 className="register-title">Registro de Usuario</h2>
            <form className="register-form" onSubmit={handleSubmit}>
                <input className="register-input" 
                    type="text" 
                    name="nombre" 
                    placeholder="Nombre Completo" 
                    onChange={handleChange} 
                    required
                />
                <input className="register-input" 
                    type="email" 
                    name="email" 
                    placeholder="Correo electronico" 
                    onChange={handleChange} 
                    required
                />                
                <input className="register-input" 
                    type="password" 
                    name="password" 
                    placeholder="Contraseña" 
                    onChange={handleChange} 
                    required
                />
                <button className="register-button" type="submit">Registrarse</button>
            </form>
            {mensaje && <p className="register-message">{mensaje}</p>}
        </div>
    )


}