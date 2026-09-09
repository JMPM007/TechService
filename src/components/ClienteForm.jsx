import { useState } from "react"
import "./ClienteForm.css"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_REGEX = /^[0-9]{7,15}$/

const CAMPOS_INICIALES = {
    cedula: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    email: ""
}

function validarFormulario(datos) {
    const errores = {}

    Object.entries(datos).forEach(([campo, valor]) => {
        if (!valor || valor.trim() === "") {
            errores[campo] = "Este campo es obligatorio"
        }
    })

    if (datos.email && !EMAIL_REGEX.test(datos.email)) {
        errores.email = "El correo electrónico no tiene un formato válido"
    }

    if (datos.telefono && !TELEFONO_REGEX.test(datos.telefono)) {
        errores.telefono = "El teléfono debe tener entre 7 y 15 dígitos numéricos"
    }

    return errores
}

export default function ClienteForm() {
    const [datos, setDatos] = useState(CAMPOS_INICIALES)
    const [errores, setErrores] = useState({})
    const [enviando, setEnviando] = useState(false)
    const [mensajeExito, setMensajeExito] = useState("")
    const [errorServidor, setErrorServidor] = useState("")

    function handleChange(e) {
        const { name, value } = e.target
        setDatos((prev) => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setMensajeExito("")
        setErrorServidor("")

        const erroresValidacion = validarFormulario(datos)
        setErrores(erroresValidacion)

        if (Object.keys(erroresValidacion).length > 0) {
            return
        }

        setEnviando(true)
        try {
            const respuesta = await fetch("http://localhost:3000/api/clientes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            })

            const resultado = await respuesta.json()

            if (!respuesta.ok) {
                setErrorServidor(resultado.error || "Ocurrió un error al registrar el cliente")
                return
            }

            setMensajeExito(`Cliente ${resultado.cliente.nombres} ${resultado.cliente.apellidos} registrado exitosamente`)
            setDatos(CAMPOS_INICIALES)
            setErrores({})

        } catch (error) {
            setErrorServidor("No se pudo conectar con el servidor")
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="cliente-form-container">
            <h2>Registrar nuevo cliente</h2>

            <form onSubmit={handleSubmit} noValidate>
                <div className="campo">
                    <label htmlFor="cedula">Número de documento</label>
                    <input
                        id="cedula"
                        name="cedula"
                        type="text"
                        value={datos.cedula}
                        onChange={handleChange}
                    />
                    {errores.cedula && <span className="error">{errores.cedula}</span>}
                </div>

                <div className="campo">
                    <label htmlFor="nombres">Nombres</label>
                    <input
                        id="nombres"
                        name="nombres"
                        type="text"
                        value={datos.nombres}
                        onChange={handleChange}
                    />
                    {errores.nombres && <span className="error">{errores.nombres}</span>}
                </div>

                <div className="campo">
                    <label htmlFor="apellidos">Apellidos</label>
                    <input
                        id="apellidos"
                        name="apellidos"
                        type="text"
                        value={datos.apellidos}
                        onChange={handleChange}
                    />
                    {errores.apellidos && <span className="error">{errores.apellidos}</span>}
                </div>

                <div className="campo">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                        id="telefono"
                        name="telefono"
                        type="text"
                        value={datos.telefono}
                        onChange={handleChange}
                        placeholder="Ej: 3001234567"
                    />
                    {errores.telefono && <span className="error">{errores.telefono}</span>}
                </div>

                <div className="campo">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        id="email"
                        name="email"
                        type="text"
                        value={datos.email}
                        onChange={handleChange}
                        placeholder="Ej: cliente@correo.com"
                    />
                    {errores.email && <span className="error">{errores.email}</span>}
                </div>

                <button type="submit" disabled={enviando}>
                    {enviando ? "Registrando..." : "Registrar cliente"}
                </button>

                {mensajeExito && <p className="mensaje-exito">{mensajeExito}</p>}
                {errorServidor && <p className="mensaje-error-servidor">{errorServidor}</p>}
            </form>
        </div>
    )
}