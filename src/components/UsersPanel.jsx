/**
 * UsersPanel.jsx
 * HU-03: Consultar lista de usuarios con filtros de rol y estado.
 * HU-05: Editar información, cambiar rol y activar/desactivar usuarios.
 * Solo visible y accesible para administradores.
 */
import { useEffect, useReducer, useState } from 'react'
import { getUsers, updateUser, setUserStatus } from '../services/userService'

const ROLES = ['', 'ADMIN', 'TECNICO', 'CLIENTE']
const ROLES_LABELS = { '': 'Todos los roles', ADMIN: 'Admin', TECNICO: 'Técnico', CLIENTE: 'Cliente' }
const ESTADO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' },
]

const initialFilter = { rol: '', activo: '' }
const emptyEdit = { nombre: '', email: '', rol: '' }

function usuarioReducer(state, action) {
  switch (action.type) {
    case 'LOADING': return { ...state, loading: true, error: '' }
    case 'LOADED': return { ...state, loading: false, usuarios: action.payload }
    case 'ERROR':  return { ...state, loading: false, error: action.payload }
    default: return state
  }
}

export default function UsersPanel() {
  const [state, dispatch] = useReducer(usuarioReducer, {
    usuarios: [],
    loading: false,
    error: '',
  })
  const [filtros, setFiltros] = useState(initialFilter)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyEdit)
  const [editError, setEditError] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [toggleId, setToggleId] = useState(null)

  // Cargar usuarios cada vez que cambien los filtros
  useEffect(() => {
    let active = true
    dispatch({ type: 'LOADING' })

    getUsers(filtros)
      .then((data) => {
        if (active) dispatch({ type: 'LOADED', payload: data.usuarios })
      })
      .catch((err) => {
        if (active) dispatch({ type: 'ERROR', payload: err.message })
      })

    return () => { active = false }
  }, [filtros])

  function handleFiltroChange(event) {
    const { name, value } = event.target
    setFiltros((prev) => ({ ...prev, [name]: value }))
  }

  function startEdit(usuario) {
    setEditingId(usuario.id)
    setEditForm({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
    setEditError('')
    setEditMessage('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(emptyEdit)
    setEditError('')
    setEditMessage('')
  }

  async function handleSave(event) {
    event.preventDefault()
    setSavingId(editingId)
    setEditError('')
    setEditMessage('')

    try {
      await updateUser(editingId, {
        nombre: editForm.nombre,
        email: editForm.email,
        rol: editForm.rol,
      })
      setEditMessage('Usuario actualizado correctamente.')
      setEditingId(null)
      // Recargar lista
      const data = await getUsers(filtros)
      dispatch({ type: 'LOADED', payload: data.usuarios })
    } catch (err) {
      setEditError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleToggleStatus(usuario) {
    const nuevoEstado = !usuario.activo
    const accion = nuevoEstado ? 'activar' : 'desactivar'
    if (!window.confirm(`¿Seguro que deseas ${accion} al usuario "${usuario.nombre}"?`)) return

    setToggleId(usuario.id)
    setEditError('')
    setEditMessage('')

    try {
      await setUserStatus(usuario.id, nuevoEstado)
      setEditMessage(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`)
      const data = await getUsers(filtros)
      dispatch({ type: 'LOADED', payload: data.usuarios })
    } catch (err) {
      setEditError(err.message)
    } finally {
      setToggleId(null)
    }
  }

  return (
    <div className="operations-grid">
      {/* Filtros */}
      <section className="card">
        <h2>Filtros</h2>
        <label htmlFor="filter-rol">Rol</label>
        <select id="filter-rol" name="rol" value={filtros.rol} onChange={handleFiltroChange}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLES_LABELS[r]}</option>
          ))}
        </select>

        <label htmlFor="filter-activo">Estado</label>
        <select id="filter-activo" name="activo" value={filtros.activo} onChange={handleFiltroChange}>
          {ESTADO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </section>

      {/* Lista de usuarios */}
      <section className="card" style={{ gridColumn: '2 / -1' }}>
        <div className="list-heading">
          <div>
            <h2>Lista de usuarios</h2>
            <p>Administra los usuarios registrados en el sistema.</p>
          </div>
        </div>

        {editMessage && <p className="alert success" role="status">{editMessage}</p>}
        {editError && <p className="alert error">{editError}</p>}

        {state.loading && <p className="empty-state">Cargando usuarios...</p>}

        {!state.loading && state.error && (
          <p className="alert error">{state.error}</p>
        )}

        {!state.loading && !state.error && state.usuarios.length === 0 && (
          <p className="empty-state">No se encontraron usuarios con los filtros seleccionados.</p>
        )}

        {!state.loading && !state.error && state.usuarios.length > 0 && (
          <div className="data-list">
            {state.usuarios.map((u) => (
              <article className="data-row" key={u.id}>
                {editingId === u.id ? (
                  /* Formulario de edición inline */
                  <form onSubmit={handleSave} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <div>
                        <label htmlFor={`edit-nombre-${u.id}`}>Nombre</label>
                        <input
                          id={`edit-nombre-${u.id}`}
                          value={editForm.nombre}
                          onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                          minLength={2}
                          maxLength={100}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-email-${u.id}`}>Correo</label>
                        <input
                          id={`edit-email-${u.id}`}
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          maxLength={100}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-rol-${u.id}`}>Rol</label>
                        <select
                          id={`edit-rol-${u.id}`}
                          value={editForm.rol}
                          onChange={(e) => setEditForm((f) => ({ ...f, rol: e.target.value }))}
                        >
                          {['ADMIN', 'TECNICO', 'CLIENTE'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" disabled={savingId === u.id}>
                          {savingId === u.id ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button type="button" className="text-button" onClick={cancelEdit}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Vista de solo lectura */
                  <>
                    <div>
                      <strong>{u.nombre}</strong>
                      <span>{u.email}</span>
                      <small>
                        <span className="role-badge">{u.rol}</span>
                        {' · '}
                        <span style={{ color: u.activo ? 'var(--success, green)' : 'var(--danger, #c00)' }}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => startEdit(u)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={toggleId === u.id}
                        style={{ color: u.activo ? 'var(--danger, #c00)' : 'var(--success, green)' }}
                      >
                        {toggleId === u.id ? '...' : u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
