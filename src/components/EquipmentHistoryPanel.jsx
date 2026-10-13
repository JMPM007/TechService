import { useEffect, useState } from 'react'
import { getEquipmentHistory, getEquipmentList, getMyEquipmentList } from '../services/operationsService'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Sin fecha'
}

export default function EquipmentHistoryPanel({ isStaff }) {
  const [search, setSearch] = useState('')
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [historial, setHistorial] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isStaff) return

    let active = true
    getMyEquipmentList()
      .then((items) => {
        if (active) setEquipos(items)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isStaff])

  async function buscarEquipos(event) {
    event.preventDefault()
    setError('')
    setMensaje('')
    setHistorial(null)
    setLoading(true)
    try {
      const response = await getEquipmentList(search.trim())
      setEquipos(response.equipos)
      setEquipoId('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function consultarHistorial(event) {
    event.preventDefault()
    if (!equipoId) return

    setError('')
    setMensaje('')
    setHistorial(null)
    setLoading(true)
    try {
      const response = await getEquipmentHistory(equipoId)
      setHistorial(response)
      setMensaje(response.mensaje ?? '')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const labelEquipo = (equipo) => [
    equipo.tipo,
    equipo.marca,
    equipo.modelo,
    equipo.numeroSerie ? `(${equipo.numeroSerie})` : '',
  ].filter(Boolean).join(' ')

  const labelOpcionEquipo = (equipo) => {
    const propietario = [equipo.nombres, equipo.apellidos].filter(Boolean).join(' ')
    const identificadorCliente = equipo.cedula ? ` · C.I. ${equipo.cedula}` : ''
    return `${labelEquipo(equipo)}${propietario ? ` · Cliente: ${propietario}${identificadorCliente}` : ''}`
  }

  return (
    <section className="card history-card equipment-history-card">
      <h2>Historial de servicios por equipo</h2>
      <p>Consulta las órdenes anteriores de un equipo. Los servicios y repuestos aparecen como conceptos cotizados, junto al estado de aprobación; esto no confirma que hayan sido ejecutados o instalados.</p>

      {isStaff && (
        <div className="equipment-history-step">
          <span className="equipment-history-step-number">1</span>
          <div className="equipment-history-step-content">
            <h3>Busca un equipo</h3>
            <p>Puedes buscar por número de serie, marca, modelo, nombre o cédula del cliente.</p>
            <form className="equipment-search-form" onSubmit={buscarEquipos}>
              <label className="visually-hidden" htmlFor="equipment-history-search">Buscar por equipo o cliente</label>
              <input
                id="equipment-history-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ej. Ana Pérez, cédula o número de serie"
              />
              <button className="equipment-history-button secondary" type="submit" disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="equipment-history-step">
        <span className="equipment-history-step-number">{isStaff ? '2' : '1'}</span>
        <div className="equipment-history-step-content">
          <h3>{isStaff ? 'Selecciona el equipo' : 'Elige uno de tus equipos'}</h3>
          {!isStaff && <p>Solo aparecen equipos asociados a tu cuenta.</p>}
          <form className="equipment-select-form" onSubmit={consultarHistorial}>
            <label className="visually-hidden" htmlFor="equipment-history-select">
              {isStaff ? 'Selecciona un equipo' : 'Selecciona uno de tus equipos'}
            </label>
            <select
              id="equipment-history-select"
              value={equipoId}
              onChange={(event) => {
                setEquipoId(event.target.value)
                setHistorial(null)
                setMensaje('')
              }}
              required
              disabled={!equipos.length || loading}
            >
              <option value="">
                {loading && !equipos.length ? 'Cargando equipos...' : 'Selecciona un equipo'}
              </option>
              {equipos.map((equipo) => (
                <option key={equipo.id} value={equipo.id}>{labelOpcionEquipo(equipo)}</option>
              ))}
            </select>
            <button className="equipment-history-button" type="submit" disabled={loading || !equipoId}>
              {loading ? 'Consultando...' : 'Consultar historial'}
            </button>
          </form>
        </div>
      </div>

      {error && <p className="alert error">{error}</p>}
      {!loading && !error && !equipos.length && (
        <p className="empty-state">{isStaff ? 'Usa el buscador para encontrar equipos registrados.' : 'No hay equipos vinculados a tu cuenta.'}</p>
      )}
      {mensaje && <p className="empty-state">{mensaje}</p>}

      {historial?.equipo && (
        <div className="equipment-history-results">
          <h3>{labelEquipo(historial.equipo)}</h3>
          {!historial.historial.length ? (
            <p className="empty-state">Este equipo todavía no tiene órdenes de servicio.</p>
          ) : (
            <ol className="equipment-history-list">
              {historial.historial.map((orden) => (
                <li key={orden.ordenId}>
                  <article className="equipment-history-order">
                    <header className="equipment-history-order-header">
                      <strong>{orden.numeroOrden}</strong>
                      <span>{formatDate(orden.fecha)} · {orden.estado}</span>
                    </header>
                    <p><strong>Diagnóstico:</strong> {orden.diagnostico || orden.fallaEncontrada || 'Sin diagnóstico registrado'}</p>
                    {orden.procedimientos && <p><strong>Procedimientos:</strong> {orden.procedimientos}</p>}
                    {orden.recomendaciones && <p><strong>Recomendaciones:</strong> {orden.recomendaciones}</p>}
                    <p><strong>Tipo de servicio:</strong> {orden.tipoServicio || 'No especificado'}</p>
                    <p><strong>Cotización:</strong> {orden.estadoCotizacion || 'No registrada'}</p>
                    <p><strong>Servicios / mano de obra cotizados:</strong> {orden.serviciosCotizados.length
                      ? orden.serviciosCotizados.map((item) => `${item.descripcion} (x${item.cantidad})`).join(', ')
                      : 'Ninguno'}</p>
                    <p><strong>Repuestos cotizados:</strong> {orden.repuestosCotizados.length
                      ? orden.repuestosCotizados.map((item) => `${item.descripcion} (x${item.cantidad})`).join(', ')
                      : 'Ninguno'}</p>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
