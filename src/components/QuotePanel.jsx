import { useState } from 'react'
import {
  createOrderQuote,
  createLaborService,
  deleteLaborService,
  getLaborServices,
  getOrderQuote,
  registerOrderQuoteDecision,
  updateLaborService,
  updateOrderQuoteConcepts,
  updateOrderQuoteStatus,
} from '../services/orderService'

const emptyConcept = {
  tipo: 'SERVICIO',
  descripcion: '',
  cantidad: '1',
  precioUnitario: '0',
  observaciones: '',
}

const emptyQuote = {
  orderId: '',
  conceptos: [emptyConcept],
  estado: '',
  subtotal: 0,
  total: 0,
}

const emptyLabor = {
  descripcion: '',
  costo: '',
  tiempoMinutos: '',
}

function QuotePanel({ isStaff, isAdmin }) {
  const [quote, setQuote] = useState(emptyQuote)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [laborServices, setLaborServices] = useState([])
  const [laborForm, setLaborForm] = useState(emptyLabor)
  const [editingLaborId, setEditingLaborId] = useState(null)

  function updateConcept(index, field, value) {
    setQuote((current) => ({
      ...current,
      conceptos: current.conceptos.map((concepto, conceptoIndex) => (
        conceptoIndex === index ? { ...concepto, [field]: value } : concepto
      )),
    }))
  }

  function addConcept() {
    setQuote((current) => ({ ...current, conceptos: [...current.conceptos, { ...emptyConcept }] }))
  }

  function removeConcept(index) {
    setQuote((current) => ({
      ...current,
      conceptos: current.conceptos.filter((_, conceptoIndex) => conceptoIndex !== index),
    }))
  }

  async function loadQuote(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const [response, laborResponse] = await Promise.all([
        getOrderQuote(quote.orderId),
        isStaff ? getLaborServices(quote.orderId) : Promise.resolve({ servicios: [] }),
      ])
      setQuote({
        orderId: quote.orderId,
        conceptos: response.cotizacion.conceptos,
        estado: response.cotizacion.estado,
        decisiones: response.cotizacion.decisiones,
        subtotal: Number(response.cotizacion.subtotal),
        total: Number(response.cotizacion.total),
      })
      setLaborServices(laborResponse.servicios ?? [])
    } catch (requestError) {
      setQuote((current) => ({ ...current, conceptos: [{ ...emptyConcept }], estado: '', decisiones: [], subtotal: 0, total: 0 }))
      setLaborServices([])
      if (requestError.status !== 404) setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveQuote(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = quote.estado
        ? await updateOrderQuoteConcepts(quote.orderId, quote.conceptos)
        : await createOrderQuote(quote.orderId, quote.conceptos)
      const saved = response.cotizacion
      setQuote((current) => ({
        ...current,
        conceptos: saved.conceptos,
        estado: saved.estado,
        subtotal: Number(saved.subtotal),
        total: Number(saved.total),
      }))
      setMessage('Cotización guardada correctamente.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function changeStatus(event) {
    const estado = event.target.value
    setLoading(true)
    setError('')
    try {
      const response = await updateOrderQuoteStatus(quote.orderId, estado)
      setQuote((current) => ({ ...current, estado: response.cotizacion.estado }))
      setMessage('Estado de cotización actualizado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function registerDecision(estado) {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await registerOrderQuoteDecision(quote.orderId, estado)
      const saved = response.cotizacion
      setQuote((current) => ({
        ...current,
        estado: saved.estado,
        decisiones: saved.decisiones,
      }))
      setMessage(response.mensaje)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function updateLaborField(event) {
    setLaborForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function startLaborEdit(service) {
    setEditingLaborId(service.id)
    setLaborForm({
      descripcion: service.descripcion,
      costo: service.costo,
      tiempoMinutos: service.tiempoMinutos ?? '',
    })
  }

  function resetLaborForm() {
    setEditingLaborId(null)
    setLaborForm(emptyLabor)
  }

  async function saveLabor(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = editingLaborId
        ? await updateLaborService(quote.orderId, editingLaborId, laborForm)
        : await createLaborService(quote.orderId, laborForm)
      setLaborServices(response.servicios ?? [])
      const refreshedQuote = await getOrderQuote(quote.orderId)
      setQuote((current) => ({
        ...current,
        subtotal: Number(refreshedQuote.cotizacion.subtotal),
        total: Number(refreshedQuote.cotizacion.total),
      }))
      setMessage(editingLaborId ? 'Servicio de mano de obra actualizado correctamente.' : 'Servicio de mano de obra registrado correctamente.')
      resetLaborForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function removeLabor(serviceId) {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await deleteLaborService(quote.orderId, serviceId)
      setLaborServices(response.servicios ?? [])
      const refreshedQuote = await getOrderQuote(quote.orderId)
      setQuote((current) => ({
        ...current,
        subtotal: Number(refreshedQuote.cotizacion.subtotal),
        total: Number(refreshedQuote.cotizacion.total),
      }))
      setMessage('Servicio de mano de obra eliminado correctamente.')
      if (editingLaborId === serviceId) resetLaborForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const calculatedTotal = quote.conceptos.reduce(
    (sum, concepto) => sum + Number(concepto.cantidad || 0) * Number(concepto.precioUnitario || 0),
    0,
  )

  return (
    <section className="card quote-card">
      <h2>Cotización de reparación</h2>
      <p>{isStaff ? 'Consulta o genera una cotización para una orden con diagnóstico registrado.' : 'Consulta la cotización de tu orden y registra tu decisión.'}</p>

      <form onSubmit={loadQuote} className="inline-form">
        <label htmlFor="quote-order-id">Número de orden</label>
        <input id="quote-order-id" type="number" min="1" value={quote.orderId} onChange={(event) => setQuote((current) => ({ ...current, orderId: event.target.value }))} required />
        <button type="submit" disabled={loading}>{loading ? 'Consultando...' : 'Cargar cotización'}</button>
      </form>

      {error && <p className="alert error">{error}</p>}
      {message && <p className="alert success">{message}</p>}

      {isStaff && <form onSubmit={saveQuote}>
        {quote.conceptos.map((concepto, index) => (
          <div className="quote-concept" key={`${index}-${concepto.id ?? 'new'}`}>
            <label htmlFor={`quote-type-${index}`}>Tipo</label>
            <select id={`quote-type-${index}`} value={concepto.tipo} onChange={(event) => updateConcept(index, 'tipo', event.target.value)}>
              <option value="SERVICIO">Servicio</option>
              <option value="MANO_OBRA">Mano de obra</option>
              <option value="REPUESTO">Repuesto</option>
            </select>
            <label htmlFor={`quote-description-${index}`}>Descripción</label>
            <input id={`quote-description-${index}`} value={concepto.descripcion} onChange={(event) => updateConcept(index, 'descripcion', event.target.value)} required />
            <div className="quote-number-fields">
              <div><label htmlFor={`quote-quantity-${index}`}>Cantidad</label><input id={`quote-quantity-${index}`} type="number" min="0.01" step="0.01" value={concepto.cantidad} onChange={(event) => updateConcept(index, 'cantidad', event.target.value)} required /></div>
              <div><label htmlFor={`quote-price-${index}`}>Precio unitario</label><input id={`quote-price-${index}`} type="number" min="0" step="0.01" value={concepto.precioUnitario} onChange={(event) => updateConcept(index, 'precioUnitario', event.target.value)} required /></div>
            </div>
            <label htmlFor={`quote-notes-${index}`}>Observaciones</label>
            <input id={`quote-notes-${index}`} value={concepto.observaciones ?? ''} onChange={(event) => updateConcept(index, 'observaciones', event.target.value)} />
            {quote.conceptos.length > 1 && <button className="text-button" type="button" onClick={() => removeConcept(index)}>Eliminar concepto</button>}
          </div>
        ))}

        <button className="secondary-button" type="button" onClick={addConcept}>Agregar concepto</button>
        <p className="quote-total">Total calculado: <strong>${calculatedTotal.toFixed(2)}</strong></p>
        <button type="submit" disabled={loading || !quote.orderId || quote.estado === 'APROBADA' || quote.estado === 'RECHAZADA' || quote.estado === 'CANCELADA'}>
          {quote.estado ? 'Actualizar conceptos' : 'Generar cotización'}
        </button>
      </form>}

      {isStaff && quote.orderId && quote.estado === 'PENDIENTE_APROBACION' && (
        <section className="labor-services-section">
          <h3>Servicios de mano de obra</h3>
          <p>Registra las actividades realizadas, su costo y el tiempo empleado cuando corresponda.</p>
          <form onSubmit={saveLabor} className="labor-service-form">
            <label htmlFor="labor-description">Descripción del servicio</label>
            <input id="labor-description" name="descripcion" value={laborForm.descripcion} onChange={updateLaborField} required />
            <label htmlFor="labor-cost">Costo</label>
            <input id="labor-cost" name="costo" type="number" min="0" step="0.01" value={laborForm.costo} onChange={updateLaborField} required />
            <label htmlFor="labor-time">Tiempo empleado (minutos, opcional)</label>
            <input id="labor-time" name="tiempoMinutos" type="number" min="1" step="1" value={laborForm.tiempoMinutos} onChange={updateLaborField} />
            <button type="submit" disabled={loading}>{editingLaborId ? 'Guardar cambios' : 'Registrar servicio'}</button>
            {editingLaborId && <button type="button" className="secondary-button" onClick={resetLaborForm}>Cancelar edición</button>}
          </form>
          <div className="data-list">
            {laborServices.map((service) => (
              <article className="data-row" key={service.id}>
                <div>
                  <strong>{service.descripcion}</strong>
                  <span>${Number(service.costo).toFixed(2)} · {service.tiempoMinutos ? `${service.tiempoMinutos} min` : 'Tiempo no registrado'}</span>
                  <small>Registrado por {service.registradoPorNombre}</small>
                </div>
                <div className="row-actions">
                  <button type="button" className="small-button" onClick={() => startLaborEdit(service)}>Editar</button>
                  <button type="button" className="text-button" onClick={() => removeLabor(service.id)} disabled={loading}>Eliminar</button>
                </div>
              </article>
            ))}
            {!laborServices.length && <p className="empty-state">No hay servicios de mano de obra registrados.</p>}
          </div>
        </section>
      )}

      {!isStaff && quote.estado === 'PENDIENTE_APROBACION' && (
        <div className="quote-decision-actions">
          <p>Esta decisión quedará registrada con la fecha y hora actuales y no podrá modificarse desde tu cuenta.</p>
          <button type="button" onClick={() => registerDecision('APROBADA')} disabled={loading}>Aprobar cotización</button>
          <button type="button" className="secondary-button" onClick={() => registerDecision('RECHAZADA')} disabled={loading}>Rechazar cotización</button>
        </div>
      )}

      {quote.estado && isAdmin && (
        <label htmlFor="quote-status">Estado
          <select id="quote-status" value={quote.estado} onChange={changeStatus} disabled={loading || quote.estado !== 'PENDIENTE_APROBACION'}>
            <option value="PENDIENTE_APROBACION">Pendiente de aprobación</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </label>
      )}

      {quote.estado && !isStaff && (
        <p className="quote-status-summary">Estado actual: <strong>{quote.estado}</strong></p>
      )}

      {quote.decisiones?.length > 0 && (
        <div className="quote-decision-history">
          <h3>Historial de decisiones</h3>
          <ul>
            {quote.decisiones.map((decision) => (
              <li key={decision.id}>
                <strong>{decision.estado}</strong>
                <span>{decision.usuarioNombre} · {new Date(decision.registradoEn).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default QuotePanel
