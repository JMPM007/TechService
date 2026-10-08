import { useState } from 'react'
import {
  createOrderQuote,
  getOrderQuote,
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

function QuotePanel() {
  const [quote, setQuote] = useState(emptyQuote)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
      const response = await getOrderQuote(quote.orderId)
      setQuote({
        orderId: quote.orderId,
        conceptos: response.cotizacion.conceptos,
        estado: response.cotizacion.estado,
        subtotal: Number(response.cotizacion.subtotal),
        total: Number(response.cotizacion.total),
      })
    } catch (requestError) {
      setQuote((current) => ({ ...current, conceptos: [{ ...emptyConcept }], estado: '', subtotal: 0, total: 0 }))
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

  const calculatedTotal = quote.conceptos.reduce(
    (sum, concepto) => sum + Number(concepto.cantidad || 0) * Number(concepto.precioUnitario || 0),
    0,
  )

  return (
    <section className="card quote-card">
      <h2>Cotización de reparación</h2>
      <p>Consulta o genera una cotización para una orden con diagnóstico registrado.</p>

      <form onSubmit={loadQuote} className="inline-form">
        <label htmlFor="quote-order-id">Número de orden</label>
        <input id="quote-order-id" type="number" min="1" value={quote.orderId} onChange={(event) => setQuote((current) => ({ ...current, orderId: event.target.value }))} required />
        <button type="submit" disabled={loading}>{loading ? 'Consultando...' : 'Cargar cotización'}</button>
      </form>

      {error && <p className="alert error">{error}</p>}
      {message && <p className="alert success">{message}</p>}

      <form onSubmit={saveQuote}>
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
      </form>

      {quote.estado && (
        <label htmlFor="quote-status">Estado
          <select id="quote-status" value={quote.estado} onChange={changeStatus} disabled={loading}>
            <option value="PENDIENTE_APROBACION">Pendiente de aprobación</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </label>
      )}
    </section>
  )
}

export default QuotePanel
