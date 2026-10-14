import { useState } from 'react'
import { getOrderByCode } from '../services/consultaService'

function formatDate(value) {
    return value ? new Date(value).toLocaleString('es-CO') : '—'
}

function formatStatus(value) {
    if (!value) return 'Sin estado'
    const text = value.replaceAll('_', ' ')
    return text.charAt(0) + text.slice(1).toLowerCase()
}

export default function OrderTrackingPanel() {
    const [code, setCode] = useState('')
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!code.trim()) {
        setError('El código de la orden es obligatorio.')
        return
    }

    setLoading(true)

    try {
        setResult(await getOrderByCode(code.trim()))
    } catch (requestError) {
        setError(requestError.message)
    } finally {
        setLoading(false)
    }
    }

    return (
    <section className="card">
        <h2>Consultar estado de mi orden</h2>
        <p>Ingresa el código que aparece en tu comprobante de recepción.</p>

        <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="tracking-code">Código de la orden</label>
        <input
            id="tracking-code"
            type="text"
            placeholder="Ej. OS-2026-0002"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength="30"
        />
        <button type="submit" disabled={loading}>
            {loading ? 'Consultando...' : 'Consultar'}
        </button>
        </form>

        {error && <p className="alert error" role="alert">{error}</p>}

        {result && (
        <div className="tracking-result">
            <h3>Orden {result.orden.codigoOrden}</h3>
            <p>
            <strong>Estado actual:</strong>{' '}
            <span className="status-pill">{formatStatus(result.orden.estado)}</span>
            </p>
            <p><strong>Fecha de ingreso:</strong> {formatDate(result.orden.fechaIngreso)}</p>
            <p>
            <strong>Equipo:</strong>{' '}
            {[result.orden.equipo.tipo, result.orden.equipo.marca, result.orden.equipo.modelo]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p><strong>Técnico asignado:</strong> {result.orden.tecnico ?? 'Aún sin asignar'}</p>

            <h3>Historial de estados</h3>
            {result.historial.length === 0 ? (
            <p className="empty-state">Esta orden todavía no tiene cambios de estado registrados.</p>
            ) : (
            <ol className="history-list">
                {result.historial.map((entry, index) => (
                <li key={`${entry.creadoEn}-${index}`}>
                    <strong>
                    {entry.estadoAnterior ? `${formatStatus(entry.estadoAnterior)} → ` : ''}
                    {formatStatus(entry.estadoNuevo)}
                    </strong>
                    <span>{formatDate(entry.creadoEn)}</span>
                </li>
                ))}
            </ol>
            )}
        </div>
        )}
    </section>
    )
}