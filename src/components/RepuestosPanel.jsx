import { useState } from 'react'
import { agregarRepuestoAOrdenService } from '../services/ordenRepuestosServices'

const initialForm = {
  ordenId: '',
  repuestoId: '',
  cantidad: '1',
}

export default function RepuestosPanel() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await agregarRepuestoAOrdenService(
        form.ordenId,
        form.repuestoId,
        form.cantidad,
      )
      setResult(response.data)
      setForm(initialForm)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <h2>Agregar repuesto a una orden</h2>
      <p>
        Registra el repuesto utilizado. El sistema valida el stock disponible,
        lo descuenta y lo asocia a la orden.
      </p>
      <p className="hint">
        Ingresa los IDs de la orden y del repuesto registrados en el inventario.
      </p>

      {error && <p className="alert error" role="alert">{error}</p>}
      {result && (
        <p className="alert success" role="status">
          Repuesto agregado. Cantidad: {result.cantidad}; precio unitario: $
          {Number(result.precio_unitario).toFixed(2)}; subtotal: $
          {Number(result.subtotal).toFixed(2)}.
        </p>
      )}

      <form onSubmit={submit}>
        <label htmlFor="repuesto-orden-id">ID de orden</label>
        <input
          id="repuesto-orden-id"
          name="ordenId"
          type="number"
          min="1"
          step="1"
          value={form.ordenId}
          onChange={updateField}
          required
        />

        <label htmlFor="repuesto-id">ID de repuesto</label>
        <input
          id="repuesto-id"
          name="repuestoId"
          type="number"
          min="1"
          step="1"
          value={form.repuestoId}
          onChange={updateField}
          required
        />

        <label htmlFor="repuesto-cantidad">Cantidad</label>
        <input
          id="repuesto-cantidad"
          name="cantidad"
          type="number"
          min="1"
          step="1"
          value={form.cantidad}
          onChange={updateField}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Agregando...' : 'Agregar repuesto'}
        </button>
      </form>
    </section>
  )
}
