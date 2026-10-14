import { useEffect, useState } from 'react'
import { getOrdersDashboard } from '../services/consultaService'

function formatStatus(value) {
    const text = value.replaceAll('_', ' ')
    return text.charAt(0) + text.slice(1).toLowerCase()
}

export default function StatusDashboardPanel() {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
    let active = true

    async function loadDashboard() {
        try {
        const response = await getOrdersDashboard()
        if (active) {
            setData(response)
            setError('')
        }
        } catch (requestError) {
        if (active) setError(requestError.message)
        } finally {
        if (active) setLoading(false)
        }
    }

    loadDashboard()
    return () => {
        active = false
    }
    }, [reloadKey])

    function handleRefresh() {
    setLoading(true)
    setReloadKey((current) => current + 1)
    }

    return (
    <section className="card">
        <div className="dashboard-toolbar">
        <h2>Órdenes por estado</h2>
        <button type="button" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
        </div>

        {error && <p className="alert error" role="alert">{error}</p>}

        {data && (
        <>
            <p className="status-total">
            Total de órdenes: <strong>{data.total}</strong>
            </p>
            <div className="status-grid">
            {data.estados.map((item) => (
                <div
                className={item.cantidad === 0 ? 'status-tile empty' : 'status-tile'}
                key={item.estado}
                >
                <span className="status-count">{item.cantidad}</span>
                <span className="status-label">{formatStatus(item.estado)}</span>
                </div>
            ))}
            </div>
        </>
        )}
    </section>
    )
}