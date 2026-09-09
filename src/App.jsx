import { useEffect, useState } from 'react'
import './App.css'

const emptyClient = { cedula: '', nombre: '', direccion: '', telefono: '', email: '' }

function App() {
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [form, setForm] = useState(emptyClient)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const value = search.trim()
    if (!value) {
      return undefined
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/clientes?search=${encodeURIComponent(value)}`)
        if (!response.ok) throw new Error('No fue posible buscar clientes')
        setClients(await response.json())
      } catch (error) {
        setStatus({ type: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [search])

  function selectClient(client) {
    setSelectedClient(client)
    setForm({ ...emptyClient, ...client })
    setStatus({ type: '', message: '' })
  }

  function changeField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function saveClient(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    try {
      const response = await fetch(`/api/clientes/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          direccion: form.direccion,
          telefono: form.telefono,
          email: form.email,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible actualizar el cliente')

      setSelectedClient(result)
      setForm({ ...emptyClient, ...result })
      setClients((current) => current.map((client) => client.id === result.id ? result : client))
      setStatus({ type: 'success', message: 'Datos actualizados correctamente' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">TS</div>
        <div>
          <p className="eyebrow">TechService / Clientes</p>
          <h1>Directorio de clientes</h1>
        </div>
        <span className="role-label">Panel operativo</span>
      </header>

      <section className="workspace" aria-label="Consultar y actualizar datos de cliente">
        <div className="search-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">HU-08</p>
              <h2>Encuentra un cliente</h2>
            </div>
            <span className="shortcut">⌘ K</span>
          </div>
          <label htmlFor="client-search">Documento o nombre</label>
          <div className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              id="client-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setClients([])
              }}
              placeholder="Ej. 100123456 o Juan Barrios"
              autoComplete="off"
            />
          </div>
          <p className="hint">Escribe al menos una parte del documento o del nombre.</p>

          <div className="results" aria-live="polite">
            {loading && <p className="empty-state">Buscando...</p>}
            {!loading && search && clients.length === 0 && <p className="empty-state">No encontramos clientes con esa búsqueda.</p>}
            {clients.map((client) => (
              <button
                className={`result-row ${selectedClient?.id === client.id ? 'active' : ''}`}
                key={client.id}
                type="button"
                onClick={() => selectClient(client)}
              >
                <span className="avatar">{client.nombre?.charAt(0) || '?'}</span>
                <span className="result-copy">
                  <strong>{client.nombre}</strong>
                  <small>{client.cedula}</small>
                </span>
                <span className="arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>

        <form className="details-panel" onSubmit={saveClient}>
          {selectedClient ? (
            <>
              <div className="panel-heading detail-heading">
                <div>
                  <p className="eyebrow">Ficha del cliente</p>
                  <h2>Información de contacto</h2>
                </div>
                <span className="status-dot">Activo</span>
              </div>
              <div className="form-grid">
                <label>Nombre completo<input name="nombre" value={form.nombre} onChange={changeField} required /></label>
                <label>Identificación <span className="locked">Protegida</span><input name="cedula" value={form.cedula} readOnly /></label>
                <label className="full-width">Dirección<input name="direccion" value={form.direccion} onChange={changeField} /></label>
                <label>Teléfono<input name="telefono" value={form.telefono} onChange={changeField} required /></label>
                <label>Correo electrónico<input name="email" type="email" value={form.email} onChange={changeField} /></label>
              </div>
              <div className="form-footer">
                <p className="protection-note"><span aria-hidden="true">◈</span> La identificación no se puede editar desde este panel.</p>
                <button className="save-button" type="submit">Guardar cambios <span aria-hidden="true">→</span></button>
              </div>
              {status.message && <p className={`feedback ${status.type}`}>{status.message}</p>}
            </>
          ) : (
            <div className="placeholder">
              <div className="placeholder-icon" aria-hidden="true">✦</div>
              <h2>Selecciona un cliente</h2>
              <p>Los datos de contacto aparecerán aquí para que puedas mantenerlos al día.</p>
            </div>
          )}
        </form>
      </section>
    </main>
  )
}

export default App
