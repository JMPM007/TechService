import { useState } from 'react'
import { createReceipt, getReceipt, getReceiptOrderData } from '../services/receiptService'

const emptyForm = {
  fallaReportada: '',
  estadoFisico: '',
  accesorios: '',
  observaciones: '',
}

function ReceiptPanel({ isStaff }) {
  const [orderId, setOrderId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function loadReceipt(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await getReceipt(orderId)
      setReceipt(response.comprobante)
    } catch (requestError) {
      setReceipt(null)
      if (requestError.status === 404 && isStaff) {
        const response = await getReceiptOrderData(orderId)
        setForm({
          fallaReportada: response.orden.motivoIngreso ?? '',
          estadoFisico: response.orden.estadoFisico ?? '',
          accesorios: response.orden.accesorios ?? '',
          observaciones: response.orden.observacionesRecepcion ?? '',
        })
        setMessage('Completa los datos de recepción para generar el comprobante.')
      } else {
        setError(requestError.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function generateReceipt(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await createReceipt(orderId, form)
      setReceipt(response.comprobante)
      setMessage(response.mensaje)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card receipt-panel">
      <h2>Comprobante de recepción</h2>
      <p>Genera o consulta el comprobante asociado a una orden de servicio.</p>
      <form onSubmit={loadReceipt} className="inline-form no-print">
        <label htmlFor="receipt-order-id">Número de orden</label>
        <input id="receipt-order-id" type="number" min="1" value={orderId} onChange={(event) => setOrderId(event.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Consultando...' : 'Consultar comprobante'}</button>
      </form>

      {message && <p className="alert success no-print">{message}</p>}
      {error && <p className="alert error no-print">{error}</p>}

      {isStaff && !receipt && form.fallaReportada && (
        <form onSubmit={generateReceipt} className="receipt-form no-print">
          <h3>Datos de recepción</h3>
          <label htmlFor="receipt-failure">Falla reportada</label>
          <textarea id="receipt-failure" name="fallaReportada" value={form.fallaReportada} onChange={updateField} required />
          <label htmlFor="receipt-physical-state">Estado físico del equipo</label>
          <textarea id="receipt-physical-state" name="estadoFisico" value={form.estadoFisico} onChange={updateField} required />
          <label htmlFor="receipt-accessories">Accesorios recibidos</label>
          <textarea id="receipt-accessories" name="accesorios" value={form.accesorios} onChange={updateField} required />
          <label htmlFor="receipt-observations">Observaciones</label>
          <textarea id="receipt-observations" name="observaciones" value={form.observaciones} onChange={updateField} />
          <button type="submit" disabled={loading}>{loading ? 'Generando...' : 'Generar comprobante'}</button>
        </form>
      )}

      {receipt && (
        <article className="receipt-printable">
          <header className="receipt-heading">
            <div><p className="eyebrow">TechService</p><h3>Comprobante de recepción</h3></div>
            <strong>{receipt.numeroComprobante}</strong>
          </header>
          <p><strong>Orden:</strong> {receipt.codigoOrden} · <strong>Fecha:</strong> {new Date(receipt.fechaRecepcion).toLocaleString()}</p>
          <div className="receipt-details">
            <div><h4>Cliente</h4><p>{receipt.cliente.nombres} {receipt.cliente.apellidos}</p><p>C.I. {receipt.cliente.cedula}</p><p>{receipt.cliente.telefono} · {receipt.cliente.email ?? 'Sin correo'}</p></div>
            <div><h4>Equipo</h4><p>{receipt.equipo.tipo} {receipt.equipo.marca} {receipt.equipo.modelo}</p><p>Serie: {receipt.equipo.numeroSerie ?? 'No registrada'}</p></div>
          </div>
          <dl className="receipt-fields">
            <div><dt>Falla reportada</dt><dd>{receipt.fallaReportada}</dd></div>
            <div><dt>Estado físico</dt><dd>{receipt.estadoFisico}</dd></div>
            <div><dt>Accesorios recibidos</dt><dd>{receipt.accesorios}</dd></div>
            <div><dt>Observaciones</dt><dd>{receipt.observaciones || 'Sin observaciones'}</dd></div>
          </dl>
          <button type="button" className="no-print" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
        </article>
      )}
    </section>
  )
}

export default ReceiptPanel