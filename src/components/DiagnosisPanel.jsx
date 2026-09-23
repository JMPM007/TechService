import { useState } from 'react'
import {
  createNewDiagnosis,
  getEquipment,
  getOrderDiagnosis,
  updateOrderDiagnosis,
} from '../services/orderService'

const emptyDiagnosis = {
  descripcion: '',
  fallaEncontrada: '',
  fechaDiagnostico: '',
  recomendaciones: '',
  procedimientos: '',
  observaciones: '',
}

function DiagnosisPanel() {
  const [orderId, setOrderId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [equipment, setEquipment] = useState(null)
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [diagnosis, setDiagnosis] = useState(emptyDiagnosis)
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setDiagnosis((current) => ({ ...current, [name]: value }))
  }

  async function loadDiagnosis(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    try {
      const response = await getOrderDiagnosis(orderId)
      setDiagnosis({
        descripcion: response.diagnostico.descripcion,
        fallaEncontrada: response.diagnostico.fallaEncontrada,
        fechaDiagnostico: response.diagnostico.fechaDiagnostico.slice(0, 16),
        recomendaciones: response.diagnostico.recomendaciones ?? '',
        procedimientos: response.diagnostico.procedimientos ?? '',
        observaciones: response.diagnostico.observaciones ?? '',
      })
      setExisting(true)
    } catch (requestError) {
      setDiagnosis(emptyDiagnosis)
      setExisting(false)
      if (requestError.status !== 404) setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadEquipment() {
    if (!equipmentId) return
    setEquipmentLoading(true)
    setError('')
    setEquipment(null)

    try {
      setEquipment(await getEquipment(equipmentId))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setEquipmentLoading(false)
    }
  }

  async function saveDiagnosis(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    try {
      if (existing) {
        await updateOrderDiagnosis(orderId, diagnosis)
        setMessage('Diagnóstico actualizado correctamente.')
      } else {
        const response = await createNewDiagnosis(equipmentId, diagnosis)
        setOrderId(String(response.ordenId))
        setExisting(true)
        setMessage(`Diagnóstico registrado. Se creó la orden #${response.ordenId}.`)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card diagnosis-card">
      <h2>Diagnóstico técnico</h2>
      <p>Registra un diagnóstico nuevo o consulta uno existente por número de orden.</p>

      {!existing && (
        <p className="workflow-note">
          El número de orden se generará automáticamente al guardar el diagnóstico.
        </p>
      )}

      <div className="diagnosis-lookup">
        <h3>Consultar diagnóstico existente</h3>
        <form onSubmit={loadDiagnosis} className="inline-form">
          <label htmlFor="diagnosis-order-id">Número de orden</label>
          <input
            id="diagnosis-order-id"
            type="number"
            min="1"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </form>
      </div>

      {error && <p className="alert error">{error}</p>}
      {message && <p className="alert success">{message}</p>}

      <form onSubmit={saveDiagnosis}>
        {!existing && (
          <>
            <h3>Registrar diagnóstico nuevo</h3>
            <div className="equipment-lookup">
              <label htmlFor="diagnosis-equipment-id">ID del equipo</label>
              <div className="inline-form">
                <input
                  id="diagnosis-equipment-id"
                  type="number"
                  min="1"
                  value={equipmentId}
                  onChange={(event) => {
                    setEquipmentId(event.target.value)
                    setEquipment(null)
                  }}
                  required
                />
                <button type="button" onClick={loadEquipment} disabled={equipmentLoading || !equipmentId}>
                  {equipmentLoading ? 'Buscando...' : 'Buscar equipo'}
                </button>
              </div>
            </div>
            {equipment && (
              <div className="equipment-summary">
                <div><span>Marca</span><strong>{equipment.marca || 'Sin marca'}</strong></div>
                <div><span>Serial</span><strong>{equipment.numeroSerie || 'Sin serial'}</strong></div>
                <div><span>Modelo</span><strong>{equipment.modelo}</strong></div>
              </div>
            )}
          </>
        )}
        <label htmlFor="diagnosis-date">Fecha del diagnóstico</label>
        <input id="diagnosis-date" name="fechaDiagnostico" type="datetime-local" value={diagnosis.fechaDiagnostico} onChange={handleChange} required />
        <label htmlFor="diagnosis-failure">Falla encontrada</label>
        <textarea id="diagnosis-failure" name="fallaEncontrada" value={diagnosis.fallaEncontrada} onChange={handleChange} required />
        <label htmlFor="diagnosis-description">Descripción del diagnóstico</label>
        <textarea id="diagnosis-description" name="descripcion" value={diagnosis.descripcion} onChange={handleChange} required />

        <button type="submit" disabled={loading || (existing ? !orderId : !equipment)}>
          {existing ? 'Actualizar diagnóstico' : 'Registrar diagnóstico'}
        </button>
      </form>

      {existing && <p className="workflow-note">Orden consultada: <strong>#{orderId}</strong></p>}
    </section>
  )
}

export default DiagnosisPanel
