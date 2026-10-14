import { useState } from 'react'
import { searchGlobal } from '../services/consultaService'

const MATCH_LABELS = {
    CEDULA: 'Cédula',
    SERIE: 'Serie del equipo',
    ORDEN: 'Código de orden',
}

function formatStatus(value) {
    if (!value) return '—'
    const text = value.replaceAll('_', ' ')
    return text.charAt(0) + text.slice(1).toLowerCase()
}

export default function GlobalSearchPanel() {
    const [term, setTerm] = useState('')
    const [results, setResults] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResults(null)

    if (!term.trim()) {
        setError('Ingresa una cédula, un número de serie o un código de orden para buscar.')
        return
    }

    setLoading(true)

    try {
        const response = await searchGlobal(term.trim())
        setResults(response.resultados)
    } catch (requestError) {
        setError(requestError.message)
    } finally {
        setLoading(false)
    }
    }

    return (
    <section className="card">
        <h2>Búsqueda global</h2>
        <p>Busca por cédula del cliente, número de serie del equipo o código de orden.</p>

        <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="global-search">Término de búsqueda</label>
        <input
            id="global-search"
            type="text"
            placeholder="Ej. 100123456, SN-0001 u OS-2026-0002"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            maxLength="100"
        />
        <button type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
        </button>
        </form>

        {error && <p className="alert error" role="alert">{error}</p>}

        {results && results.length === 0 && (
        <p className="empty-state">No se encontraron coincidencias para «{term.trim()}».</p>
        )}

        {results && results.length > 0 && (
        <div className="results-wrapper">
            <table className="results-table">
            <thead>
                <tr>
                <th>Coincidió por</th>
                <th>Cliente</th>
                <th>Cédula</th>
                <th>Equipo</th>
                <th>Serie</th>
                <th>Orden</th>
                <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {results.map((row) => (
                <tr key={`${row.clienteId}-${row.equipoId ?? 'x'}-${row.ordenId ?? 'x'}`}>
                    <td>{MATCH_LABELS[row.coincidencia]}</td>
                    <td>{row.nombres} {row.apellidos}</td>
                    <td>{row.cedula}</td>
                    <td>{[row.tipo, row.marca, row.modelo].filter(Boolean).join(' · ') || '—'}</td>
                    <td>{row.numeroSerie ?? '—'}</td>
                    <td>{row.codigoOrden ?? '—'}</td>
                    <td>{formatStatus(row.estado)}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}
    </section>
    )
}