import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function ListaOrdenes({ onNuevaOrden, highlightOrdenId }) {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [selectedOrdenDetalle, setSelectedOrdenDetalle] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const loadOrdenes = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const data = await api.getOrdenes({ search, estado: selectedEstado })
      setOrdenes(data.ordenes || [])

      if (highlightOrdenId && data.ordenes) {
        const target = data.ordenes.find((o) => o.id === highlightOrdenId || o.codigo_orden === highlightOrdenId)
        if (target) {
          setSelectedOrdenDetalle(target)
        }
      }
    } catch (err) {
      console.error('Error al cargar órdenes:', err)
      setErrorMsg('No se pudieron consultar las órdenes de servicio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrdenes()
  }, [selectedEstado])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadOrdenes()
  }

  const handleVerDetalle = async (id) => {
    try {
      const data = await api.getOrdenById(id)
      setSelectedOrdenDetalle(data.orden)
    } catch (err) {
      console.error('Error al consultar orden específica:', err)
    }
  }

  return (
    <div className="workspace-container">
      <div className="workspace-header-bar">
        <div>
          <p className="eyebrow">Gestión Operativa</p>
          <h2>Directorio de Órdenes de Servicio</h2>
        </div>
        <button type="button" className="save-button" onClick={onNuevaOrden}>
          + Nueva Orden de Servicio
        </button>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} className="search-field flex-1">
          <span aria-hidden="true">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código (ej: OS-2026-0001), serie o cliente..."
          />
        </form>

        <select
          value={selectedEstado}
          onChange={(e) => setSelectedEstado(e.target.value)}
          className="clean-select"
        >
          <option value="">Todos los Estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="EN_ESPERA_REPUESTO">En Espera de Repuesto</option>
          <option value="COMPLETADO">Completado</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {errorMsg && (
        <div className="feedback-banner error">
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="table-card">
        {loading ? (
          <p className="empty-state">Consultando órdenes...</p>
        ) : ordenes.length === 0 ? (
          <div className="placeholder">
            <div className="placeholder-icon">✦</div>
            <h2>No se encontraron órdenes</h2>
            <p>No hay órdenes registradas que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tech-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipo</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong className="code-text">{o.codigo_orden}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{o.equipo_marca} {o.equipo_modelo}</strong>
                        <small className="block-muted">S/N: {o.equipo_serie}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span>{o.cliente_nombre}</span>
                        <small className="block-muted">C.C. {o.cliente_cedula}</small>
                      </div>
                    </td>
                    <td>{o.tipo_servicio}</td>
                    <td>
                      <span className={`pill-badge prio-${o.prioridad.toLowerCase()}`}>
                        {o.prioridad}
                      </span>
                    </td>
                    <td>
                      <span className={`pill-badge status-${o.estado.toLowerCase()}`}>
                        {o.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <small className="mono-date">
                        {new Date(o.creado_en).toLocaleDateString()}
                      </small>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleVerDetalle(o.id)}
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE COMPLETO DE LA ORDEN */}
      {selectedOrdenDetalle && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Detalle de Servicio</p>
                <h3>Orden: {selectedOrdenDetalle.codigo_orden}</h3>
                <p className="modal-subtitle">
                  Registrada el {new Date(selectedOrdenDetalle.creado_en).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedOrdenDetalle(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="order-summary-tags">
                <span className="status-dot">Estado: {selectedOrdenDetalle.estado.replace('_', ' ')}</span>
                <span className="shortcut">Prioridad: {selectedOrdenDetalle.prioridad}</span>
                <span className="shortcut">Tipo: {selectedOrdenDetalle.tipo_servicio}</span>
              </div>

              <div className="specs-grid mt-3">
                <div className="spec-card">
                  <span className="spec-card-title">Equipo Asociado</span>
                  <div className="spec-row">
                    <span className="spec-label">Dispositivo:</span>
                    <span className="spec-val font-bold">
                      {selectedOrdenDetalle.equipo_marca} {selectedOrdenDetalle.equipo_modelo}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Número de Serie:</span>
                    <span className="spec-val highlight-code">{selectedOrdenDetalle.equipo_serie}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Tipo:</span>
                    <span className="spec-val">{selectedOrdenDetalle.equipo_tipo}</span>
                  </div>
                  {selectedOrdenDetalle.equipo_procesador && (
                    <div className="spec-row">
                      <span className="spec-label">CPU:</span>
                      <span className="spec-val">{selectedOrdenDetalle.equipo_procesador}</span>
                    </div>
                  )}
                </div>

                <div className="spec-card">
                  <span className="spec-card-title">Cliente & Responsable</span>
                  <div className="spec-row">
                    <span className="spec-label">Cliente:</span>
                    <span className="spec-val font-bold">{selectedOrdenDetalle.cliente_nombre}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Cédula:</span>
                    <span className="spec-val">{selectedOrdenDetalle.cliente_cedula}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Teléfono:</span>
                    <span className="spec-val">{selectedOrdenDetalle.cliente_telefono}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Técnico:</span>
                    <span className="spec-val">
                      {selectedOrdenDetalle.tecnico_nombre || 'Pendiente de asignación'}
                    </span>
                  </div>
                </div>

                <div className="spec-card full-span">
                  <span className="spec-card-title">Motivo de Ingreso</span>
                  <p className="spec-paragraph">{selectedOrdenDetalle.motivo_ingreso}</p>
                </div>

                <div className="spec-card">
                  <span className="spec-card-title">Información Financiera</span>
                  <div className="spec-row">
                    <span className="spec-label">Costo Estimado:</span>
                    <strong className="spec-val text-accent-color">
                      ${Number(selectedOrdenDetalle.costo_estimado || 0).toLocaleString()} COP
                    </strong>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Abono Inicial:</span>
                    <span className="spec-val">
                      ${Number(selectedOrdenDetalle.abono_inicial || 0).toLocaleString()} COP
                    </span>
                  </div>
                </div>

                <div className="spec-card">
                  <span className="spec-card-title">Observaciones de Recepción</span>
                  <p className="spec-paragraph">
                    {selectedOrdenDetalle.observaciones_recepcion || 'Sin observaciones registradas.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="form-footer mt-3">
              <button
                type="button"
                className="save-button"
                onClick={() => setSelectedOrdenDetalle(null)}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
