import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import EditarEquipoModal from './EditarEquipoModal'

export default function FichaTecnica({ onCrearOrdenConEquipo }) {
  const [equiposList, setEquiposList] = useState([])
  const [selectedEquipoId, setSelectedEquipoId] = useState(null)
  const [equipoDetalle, setEquipoDetalle] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchNotFoundMessage, setSearchNotFoundMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  const loadEquipos = async (term = '') => {
    try {
      setLoading(true)
      const data = await api.getEquipos(term)
      setEquiposList(data.equipos || [])

      if (term.trim() !== '' && (!data.equipos || data.equipos.length === 0)) {
        setSearchNotFoundMessage(`No se encontró ningún equipo registrado con el criterio: "${term}".`)
        setEquipoDetalle(null)
        setSelectedEquipoId(null)
      } else {
        setSearchNotFoundMessage('')
        if (data.equipos && data.equipos.length > 0) {
          const currentExists = data.equipos.some((e) => e.id === selectedEquipoId)
          if (!currentExists && !selectedEquipoId) {
            fetchDetalle(data.equipos[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar equipos:', err)
      setSearchNotFoundMessage('Error al consultar los equipos registrados.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDetalle = async (id) => {
    try {
      setLoading(true)
      setSearchNotFoundMessage('')
      const data = await api.getEquipoById(id)
      if (data.equipo) {
        setEquipoDetalle(data.equipo)
        setSelectedEquipoId(data.equipo.id)
      }
    } catch (err) {
      console.error('Error al obtener ficha:', err)
      setSearchNotFoundMessage(err.message || 'El equipo consultado no existe o no se encuentra registrado.')
      setEquipoDetalle(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEquipos()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      setSearchNotFoundMessage('')
      loadEquipos()
      return
    }
    loadEquipos(searchTerm.trim())
  }

  const handleEquipoActualizado = (equipoActualizado, mensaje) => {
    setEquipoDetalle(equipoActualizado)
    setFeedbackMessage({
      type: 'success',
      text: mensaje || 'Las características del equipo fueron actualizadas correctamente.'
    })
    loadEquipos(searchTerm)
    setTimeout(() => setFeedbackMessage(null), 5000)
  }

  return (
    <div className="workspace-container">
      {/* MENSAJES DE ESTADO */}
      {feedbackMessage && (
        <div className={`feedback-banner ${feedbackMessage.type}`}>
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {searchNotFoundMessage && (
        <div className="feedback-banner warning">
          <strong>Aviso: </strong>
          <span>{searchNotFoundMessage}</span>
        </div>
      )}

      <section className="workspace" aria-label="Ficha técnica de equipos">
        {/* PANEL IZQUIERDO: BUSCADOR Y LISTA DE EQUIPOS */}
        <div className="search-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Gestión de Equipos</p>
              <h2>Ficha Técnica</h2>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit}>
            <label htmlFor="equipo-search">Número de serie, marca o cliente</label>
            <div className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                id="equipo-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej. SN-LEN-88231 o ThinkPad"
                autoComplete="off"
              />
            </div>
            <p className="hint">Consulta las características técnicas registradas antes de un servicio.</p>
          </form>

          <div className="results" aria-live="polite">
            {loading && <p className="empty-state">Consultando equipos...</p>}
            {!loading && equiposList.map((eq) => (
              <button
                key={eq.id}
                type="button"
                className={`result-row ${selectedEquipoId === eq.id ? 'active' : ''}`}
                onClick={() => fetchDetalle(eq.id)}
              >
                <span className="avatar">💻</span>
                <span className="result-copy">
                  <strong>{eq.marca} {eq.modelo}</strong>
                  <small>S/N: {eq.numero_serie} • {eq.cliente_nombre}</small>
                </span>
                <span className="arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: DETALLE DE LA FICHA TÉCNICA */}
        <div className="details-panel technical-sheet-panel">
          {equipoDetalle ? (
            <div>
              <div className="panel-heading detail-heading">
                <div>
                  <p className="eyebrow">Especificaciones Técnicas</p>
                  <h2>{equipoDetalle.marca} {equipoDetalle.modelo}</h2>
                </div>
                <span className="status-dot">{equipoDetalle.tipo_equipo}</span>
              </div>

              {/* ACCIONES */}
              <div className="sheet-actions-bar">
                <button
                  type="button"
                  className="btn-sheet-edit"
                  onClick={() => setShowEditModal(true)}
                >
                  Editar Características
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={() => onCrearOrdenConEquipo && onCrearOrdenConEquipo(equipoDetalle)}
                >
                  Crear Orden de Servicio <span aria-hidden="true">→</span>
                </button>
              </div>

              {/* BLOQUES ORGANIZADOS SEGÚN PROPIEDADES */}
              <div className="specs-grid">
                {/* 1. IDENTIFICACIÓN Y CLIENTE */}
                <div className="spec-card">
                  <span className="spec-card-title">Identificación & Propietario</span>
                  <div className="spec-row">
                    <span className="spec-label">Número de Serie:</span>
                    <span className="spec-val highlight-code">{equipoDetalle.numero_serie}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Cliente Titular:</span>
                    <span className="spec-val font-bold">{equipoDetalle.cliente_nombre}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Cédula:</span>
                    <span className="spec-val">{equipoDetalle.cliente_cedula}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Teléfono:</span>
                    <span className="spec-val">{equipoDetalle.cliente_telefono}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Fecha de Registro:</span>
                    <span className="spec-val">{new Date(equipoDetalle.creado_en).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* 2. ESPECIFICACIONES DE HARDWARE */}
                <div className="spec-card">
                  <span className="spec-card-title">Hardware</span>
                  <div className="spec-row">
                    <span className="spec-label">Procesador (CPU):</span>
                    <span className="spec-val">{equipoDetalle.procesador || 'No especificado'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Memoria RAM:</span>
                    <span className="spec-val">{equipoDetalle.memoria_ram || 'No especificado'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Almacenamiento:</span>
                    <span className="spec-val">{equipoDetalle.almacenamiento || 'No especificado'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Tarjeta Gráfica:</span>
                    <span className="spec-val">{equipoDetalle.tarjeta_grafica || 'Integrada'}</span>
                  </div>
                </div>

                {/* 3. SISTEMA Y SOFTWARE */}
                <div className="spec-card">
                  <span className="spec-card-title">Sistema & Software</span>
                  <div className="spec-row">
                    <span className="spec-label">Sistema Operativo:</span>
                    <span className="spec-val">{equipoDetalle.sistema_operativo || 'No registrado'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Tipo de Equipo:</span>
                    <span className="spec-val">{equipoDetalle.tipo_equipo}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Última Actualización:</span>
                    <span className="spec-val">
                      {new Date(equipoDetalle.actualizado_en || equipoDetalle.creado_en).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* 4. ESTADO FÍSICO Y ACCESORIOS */}
                <div className="spec-card full-span">
                  <span className="spec-card-title">Estado Físico, Accesorios y Observaciones</span>
                  <div className="spec-detail-box">
                    <strong>Estado Físico / Estético:</strong>
                    <p>{equipoDetalle.estado_fisico || 'Sin observaciones estéticas.'}</p>
                  </div>
                  <div className="spec-detail-box">
                    <strong>Accesorios Entregados:</strong>
                    <p>{equipoDetalle.accesorios || 'Sin accesorios adjuntos.'}</p>
                  </div>
                  {equipoDetalle.observaciones && (
                    <div className="spec-detail-box">
                      <strong>Observaciones Técnicas:</strong>
                      <p>{equipoDetalle.observaciones}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-footer">
                <p className="protection-note">
                  <span aria-hidden="true">◈</span> Consulta técnica en modo lectura. La visualización no altera ningún dato del equipo.
                </p>
              </div>
            </div>
          ) : (
            <div className="placeholder">
              <div className="placeholder-icon" aria-hidden="true">✦</div>
              <h2>Selecciona un equipo</h2>
              <p>Las propiedades y características técnicas aparecerán aquí para tu consulta.</p>
            </div>
          )}
        </div>
      </section>

      {/* MODAL DE EDICIÓN */}
      {showEditModal && equipoDetalle && (
        <EditarEquipoModal
          equipo={equipoDetalle}
          onClose={() => setShowEditModal(false)}
          onEquipoActualizado={handleEquipoActualizado}
        />
      )}
    </div>
  )
}
