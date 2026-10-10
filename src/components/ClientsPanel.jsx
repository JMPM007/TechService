import { useEffect, useState } from 'react'
import { getClients, registerClient } from '../services/clientService'

const emptyClient = {
  cedula: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  email: '',
}

export default function ClientsPanel() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyClient)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getClients(search)
        if (active) setClients(response.clientes)
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitClient(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await registerClient(form)
      setMessage(response.mensaje)
      setForm(emptyClient)
      const refreshed = await getClients(search)
      setClients(refreshed.clientes)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="operations-grid">
      <section className="card">
        <h2>Registrar cliente</h2>
        {message && <p className="alert success" role="status">{message}</p>}
        {error && <p className="alert error">{error}</p>}
        <form onSubmit={submitClient}>
          <label htmlFor="client-cedula">Cédula</label>
          <input id="client-cedula" name="cedula" value={form.cedula} onChange={updateField} required />
          <label htmlFor="client-nombres">Nombres</label>
          <input id="client-nombres" name="nombres" value={form.nombres} onChange={updateField} required />
          <label htmlFor="client-apellidos">Apellidos</label>
          <input id="client-apellidos" name="apellidos" value={form.apellidos} onChange={updateField} required />
          <label htmlFor="client-telefono">Teléfono</label>
          <input id="client-telefono" name="telefono" value={form.telefono} onChange={updateField} required />
          <label htmlFor="client-email">Correo electrónico</label>
          <input id="client-email" name="email" type="email" value={form.email} onChange={updateField} required />
          <button type="submit">Guardar cliente</button>
        </form>
      </section>
      <section className="card">
        <div className="list-heading">
          <div><h2>Directorio de clientes</h2><p>Busca por nombre, cédula o correo.</p></div>
        </div>
        <label htmlFor="client-search">Buscar cliente</label>
        <input id="client-search" value={search} onChange={(event) => setSearch(event.target.value)} />
        {loading && <p className="empty-state">Cargando clientes...</p>}
        {!loading && !error && (
          <div className="data-list">
            {clients.map((client) => (
              <article className="data-row" key={client.id}>
                <div>
                  <strong>{client.nombres} {client.apellidos}</strong>
                  <span>Cédula: {client.cedula} · Teléfono: {client.telefono}</span>
                  <small>{client.email}</small>
                </div>
                <b>#{client.id}</b>
              </article>
            ))}
            {!clients.length && <p className="empty-state">No hay clientes para mostrar.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
