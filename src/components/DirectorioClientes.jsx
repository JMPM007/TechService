import React, { useEffect, useState } from 'react'
import { api } from '../services/api'

const emptyClient = { cedula: '', nombre: '', direccion: '', telefono: '', email: '' }

export default function DirectorioClientes({ onCrearEquipoConCliente }) {
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [form, setForm] = useState(emptyClient)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClient, setNewClient] = useState({ cedula: '', nombre: '', direccion: '', telefono: '', email: '' })
  const [newClientStatus, setNewClientStatus] = useState({ type: '', message: '' })

  // Cargar clientes iniciales o al buscar
  useEffect(() => {
    let active = true
    const term = search.trim()

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.getClientes(term)
        if (active) {
          const list = Array.isArray(data) ? data : (data.clientes || [])
          setClients(list)
          if (!selectedClient && list.length > 0 && !term) {
            selectClient(list[0])
          }
        }
      } catch (error) {
        if (active) setStatus({ type: 'error', message: error.message })
      } finally {
        if (active) setLoading(false)
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])

  function selectClient(client) {
    setSelectedClient(client)
    setForm({ ...emptyClient, ...client })
    setStatus({ type: '', message: '' })
    setShowNewClientForm(false)
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
      setClients((current) => current.map((c) => (c.id === result.id ? result : c)))
      setStatus({ type: 'success', message: 'Datos actualizados correctamente' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function handleCreateClient(event) {
    event.preventDefault()
    setNewClientStatus({ type: '', message: '' })
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No fue posible registrar el cliente')

      setNewClientStatus({ type: 'success', message: 'Cliente registrado con éxito' })
      setClients((prev) => [data, ...prev])
      selectClient(data)
      setNewClient({ cedula: '', nombre: '', direccion: '', telefono: '', email: '' })
      setTimeout(() => setShowNewClientForm(false), 800)
    } catch (err) {
      setNewClientStatus({ type: 'error', message: err.message })
    }
  }

  return (
    <section className="workspace" aria-label="Consultar y actualizar datos de cliente">
      {/* PANEL IZQUIERDO: BÚSQUEDA Y LISTADO */}
      <div className="search-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Directorio de Clientes</p>
            <h2>Encuentra un cliente</h2>
          </div>
          <button
            type="button"
            className="shortcut-btn"
            onClick={() => {
              setShowNewClientForm(true)
              setSelectedClient(null)
            }}
            title="Registrar nuevo cliente"
          >
            + Nuevo
          </button>
        </div>

        <label htmlFor="client-search">Documento o nombre</label>
        <div className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            id="client-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ej. 100123456 o Juan Barrios"
            autoComplete="off"
          />
        </div>
        <p className="hint">Escribe al menos una parte del documento o del nombre.</p>

        <div className="results" aria-live="polite">
          {loading && <p className="empty-state">Buscando clientes...</p>}
          {!loading && search && clients.length === 0 && (
            <p className="empty-state">No encontramos clientes con esa búsqueda.</p>
          )}
          {clients.map((client) => (
            <button
              className={`result-row ${selectedClient?.id === client.id && !showNewClientForm ? 'active' : ''}`}
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

      {/* PANEL DERECHO: FORMULARIO DE CLIENTE (CREAR O EDITAR) */}
      <div className="details-panel">
        {showNewClientForm ? (
          <form onSubmit={handleCreateClient}>
            <div className="panel-heading detail-heading">
              <div>
                <p className="eyebrow">Registro de Cliente</p>
                <h2>Nuevo Cliente</h2>
              </div>
              <button
                type="button"
                className="shortcut-btn"
                onClick={() => setShowNewClientForm(false)}
              >
                Volver
              </button>
            </div>
            <div className="form-grid">
              <label>
                Número de Identificación (Cédula) *
                <input
                  name="cedula"
                  value={newClient.cedula}
                  onChange={(e) => setNewClient({ ...newClient, cedula: e.target.value })}
                  placeholder="Ej. 100123456"
                  required
                />
              </label>
              <label>
                Nombre Completo *
                <input
                  name="nombre"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                  placeholder="Ej. Carlos Mendoza"
                  required
                />
              </label>
              <label className="full-width">
                Dirección
                <input
                  name="direccion"
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
                  placeholder="Ej. Calle 10 # 20-30"
                />
              </label>
              <label>
                Teléfono *
                <input
                  name="telefono"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                  placeholder="Ej. 3001234567"
                  required
                />
              </label>
              <label>
                Correo Electrónico
                <input
                  name="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="cliente@ejemplo.com"
                />
              </label>
            </div>
            <div className="form-footer">
              <p className="protection-note">
                <span aria-hidden="true">◈</span> Los campos con (*) son obligatorios para el registro.
              </p>
              <button className="save-button" type="submit">
                Registrar Cliente <span aria-hidden="true">→</span>
              </button>
            </div>
            {newClientStatus.message && (
              <p className={`feedback ${newClientStatus.type}`}>{newClientStatus.message}</p>
            )}
          </form>
        ) : selectedClient ? (
          <form onSubmit={saveClient}>
            <div className="panel-heading detail-heading">
              <div>
                <p className="eyebrow">Ficha del cliente</p>
                <h2>Información de contacto</h2>
              </div>
              <span className="status-dot">Activo</span>
            </div>
            <div className="form-grid">
              <label>
                Nombre completo
                <input name="nombre" value={form.nombre} onChange={changeField} required />
              </label>
              <label>
                Identificación <span className="locked">Protegida</span>
                <input name="cedula" value={form.cedula} readOnly />
              </label>
              <label className="full-width">
                Dirección
                <input name="direccion" value={form.direccion || ''} onChange={changeField} />
              </label>
              <label>
                Teléfono
                <input name="telefono" value={form.telefono} onChange={changeField} required />
              </label>
              <label>
                Correo electrónico
                <input name="email" type="email" value={form.email || ''} onChange={changeField} />
              </label>
            </div>
            <div className="form-footer">
              <p className="protection-note">
                <span aria-hidden="true">◈</span> La identificación no se puede editar desde este panel.
              </p>
              <button className="save-button" type="submit">
                Guardar cambios <span aria-hidden="true">→</span>
              </button>
            </div>
            {status.message && <p className={`feedback ${status.type}`}>{status.message}</p>}
          </form>
        ) : (
          <div className="placeholder">
            <div className="placeholder-icon" aria-hidden="true">✦</div>
            <h2>Selecciona un cliente</h2>
            <p>Los datos de contacto aparecerán aquí para que puedas mantenerlos al día.</p>
          </div>
        )}
      </div>
    </section>
  )
}
