import { useEffect, useState } from "react"
import "./OrdenesPanel.css"

const ESTADOS_VALIDOS = ["Registrada", "Asignada", "En proceso", "Finalizada", "Cerrada"]

export default function OrdenesPanel() {
    const [ordenes, setOrdenes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [errorGeneral, setErrorGeneral] = useState("")
    const [accionEnCurso, setAccionEnCurso] = useState(null) // id de la orden con acción en curso

    async function cargarOrdenes() {
        setCargando(true)
        setErrorGeneral("")
        try {
            const respuesta = await fetch("http://localhost:3000/api/ordenes")
            const resultado = await respuesta.json()
            if (!respuesta.ok) throw new Error(resultado.error || "Error al cargar órdenes")
            setOrdenes(resultado.ordenes)
        } catch (error) {
            setErrorGeneral(error.message)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarOrdenes()
    }, [])

    async function manejarAsignar(ordenId) {
        const tecnicoId = prompt("Ingresa el ID del técnico a asignar:")
        if (!tecnicoId) return

        setAccionEnCurso(ordenId)
        try {
            const respuesta = await fetch(`http://localhost:3000/api/ordenes/${ordenId}/asignar`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tecnicoId: Number(tecnicoId) })
            })
            const resultado = await respuesta.json()
            if (!respuesta.ok) throw new Error(resultado.error)
            await cargarOrdenes()
        } catch (error) {
            alert(error.message)
        } finally {
            setAccionEnCurso(null)
        }
    }

    async function manejarCambioEstado(ordenId, tecnicoId) {
        const nuevoEstado = prompt(
            `Nuevo estado (opciones: ${ESTADOS_VALIDOS.join(", ")}):`
        )
        if (!nuevoEstado) return

        setAccionEnCurso(ordenId)
        try {
            const respuesta = await fetch(`http://localhost:3000/api/ordenes/${ordenId}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevoEstado, tecnicoId })
            })
            const resultado = await respuesta.json()
            if (!respuesta.ok) throw new Error(resultado.error)
            await cargarOrdenes()
        } catch (error) {
            alert(error.message)
        } finally {
            setAccionEnCurso(null)
        }
    }

    async function manejarCerrar(ordenId) {
        const observaciones = prompt("Observaciones finales del cierre:")
        if (!observaciones) return

        setAccionEnCurso(ordenId)
        try {
            const respuesta = await fetch(`http://localhost:3000/api/ordenes/${ordenId}/cerrar`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ observaciones })
            })
            const resultado = await respuesta.json()
            if (!respuesta.ok) throw new Error(resultado.error)
            await cargarOrdenes()
        } catch (error) {
            alert(error.message)
        } finally {
            setAccionEnCurso(null)
        }
    }

    if (cargando) return <p className="ordenes-mensaje">Cargando órdenes...</p>
    if (errorGeneral) return <p className="ordenes-mensaje error">{errorGeneral}</p>

    return (
        <div className="ordenes-panel">
            <div className="ordenes-header">
                <h2>Órdenes de servicio</h2>
                <button onClick={cargarOrdenes} className="btn-refrescar">Refrescar</button>
            </div>

            {ordenes.length === 0 ? (
                <p className="ordenes-mensaje">No hay órdenes registradas.</p>
            ) : (
                <table className="ordenes-tabla">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Técnico</th>
                            <th>Estado</th>
                            <th>Falla</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordenes.map((orden) => (
                            <tr key={orden.id}>
                                <td>{orden.id}</td>
                                <td>{orden.cliente_nombres} {orden.cliente_apellidos}</td>
                                <td>{orden.tecnico_nombre || "Sin asignar"}</td>
                                <td>
                                    <span className={`badge estado-${orden.estado.replace(" ", "-").toLowerCase()}`}>
                                        {orden.estado}
                                    </span>
                                </td>
                                <td>{orden.descripcion_falla}</td>
                                <td className="acciones">
                                    <button
                                        disabled={orden.estado === "Cerrada" || accionEnCurso === orden.id}
                                        onClick={() => manejarAsignar(orden.id)}
                                    >
                                        Asignar
                                    </button>
                                    <button
                                        disabled={orden.estado === "Cerrada" || accionEnCurso === orden.id}
                                        onClick={() => manejarCambioEstado(orden.id, orden.tecnico_id)}
                                    >
                                        Cambiar estado
                                    </button>
                                    <button
                                        disabled={orden.estado !== "Finalizada" || accionEnCurso === orden.id}
                                        onClick={() => manejarCerrar(orden.id)}
                                    >
                                        Cerrar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}