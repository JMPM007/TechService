import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function CrearOrdenServicio({ preselectedEquipo, onOrdenCreada, onIrAOrdenes }) {
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [selectedEquipoId, setSelectedEquipoId] = useState(preselectedEquipo ? preselectedEquipo.id : '')
  const [selectedEquipo, setSelectedEquipo] = useState(preselectedEquipo || null)

  const [formData, setFormData] = useState({
    motivo_ingreso: '',
    tipo_servicio: 'Mantenimiento Preventivo',
    prioridad: 'MEDIA',
    tecnico_id: '',
    costo_estimado: '',
    abono_inicial: '',
    observaciones_recepcion: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successResult, setSuccessResult] = useState(null)
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [equiposData, tecnicosData] = await Promise.all([
          api.getEquipos(),
          api.getTecnicos()
        ])
        setEquipos(equiposData.equipos || [])
        setTecnicos(tecnicosData.tecnicos || [])

        if (preselectedEquipo) {
          setSelectedEquipo(preselectedEquipo)
          setSelectedEquipoId(preselectedEquipo.id)
        } else if (equiposData.equipos && equiposData.equipos.length > 0) {
          setSelectedEquipo(equiposData.equipos[0])
          setSelectedEquipoId(equiposData.equipos[0].id)
        }
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setGeneralError('No se pudieron cargar los equipos o técnicos registrados.')
      }
    }
    loadData()
  }, [preselectedEquipo])

  const handleEquipoChange = (e) => {
    const id = parseInt(e.target.value, 10)
    setSelectedEquipoId(id)
    const eq = equipos.find((item) => item.id === id)
    setSelectedEquipo(eq || null)
    if (errors.equipo_id) {
      setErrors((prev) => ({ ...prev, equipo_id: null }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!selectedEquipoId) {
      newErrors.equipo_id = 'Debe seleccionar un equipo para asociar la orden.'
    }
    if (!formData.motivo_ingreso.trim()) {
      newErrors.motivo_ingreso = 'El motivo de ingreso o falla reportada es obligatorio.'
    }
    if (!formData.tipo_servicio.trim()) {
      newErrors.tipo_servicio = 'El tipo de servicio es obligatorio.'
    }
    if (formData.costo_estimado && (isNaN(formData.costo_estimado) || Number(formData.costo_estimado) < 0)) {
      newErrors.costo_estimado = 'El costo estimado debe ser un número mayor o igual a 0.'
    }
    if (formData.abono_inicial && (isNaN(formData.abono_inicial) || Number(formData.abono_inicial) < 0)) {
      newErrors.abono_inicial = 'El abono inicial debe ser un número mayor o igual a 0.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setSuccessResult(null)

    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      const payload = {
        equipo_id: selectedEquipoId,
        tecnico_id: formData.tecnico_id || null,
        motivo_ingreso: formData.motivo_ingreso.trim(),
        tipo_servicio: formData.tipo_servicio,
        prioridad: formData.prioridad,
        costo_estimado: formData.costo_estimado ? Number(formData.costo_estimado) : 0,
        abono_inicial: formData.abono_inicial ? Number(formData.abono_inicial) : 0,
        observaciones_recepcion: formData.observaciones_recepcion.trim()
      }

      const res = await api.createOrden(payload)
      setSuccessResult(res)

      if (onOrdenCreada) {
        onOrdenCreada(res.orden)
      }

      setFormData({
        motivo_ingreso: '',
        tipo_servicio: 'Mantenimiento Preventivo',
        prioridad: 'MEDIA',
        tecnico_id: '',
        costo_estimado: '',
        abono_inicial: '',
        observaciones_recepcion: ''
      })
    } catch (err) {
      console.error('Error al crear orden:', err)
      setGeneralError(err.message || 'Error al registrar la orden de servicio.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="workspace-container">
      {generalError && (
        <div className="feedback-banner error">
          <span>{generalError}</span>
        </div>
      )}

      {successResult && (
        <div className="feedback-banner success">
          <div className="order-success-content">
            <strong>¡Orden de Servicio Generada con Éxito!</strong>
            <p>{successResult.mensaje}</p>
            <div className="order-success-badges">
              <span className="badge-highlight">Código: {successResult.codigo_orden}</span>
              <span>Equipo: {successResult.orden.equipo_marca} {successResult.orden.equipo_modelo}</span>
              <span>Cliente: {successResult.orden.cliente_nombre}</span>
            </div>
            <div className="mt-3">
              <button
                type="button"
                className="save-button"
                onClick={() => onIrAOrdenes && onIrAOrdenes()}
              >
                Ir a Directorio de Órdenes <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="workspace" aria-label="Crear orden de servicio">
        {/* PANEL IZQUIERDO: SELECCIÓN Y VERIFICACIÓN DEL EQUIPO */}
        <div className="search-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Asociación de Equipo</p>
              <h2>1. Selecciona el equipo</h2>
            </div>
          </div>

          <label htmlFor="select-equipo-orden">Equipo para la orden de servicio *</label>
          <div className="select-field-wrap">
            <select
              id="select-equipo-orden"
              value={selectedEquipoId}
              onChange={handleEquipoChange}
              className={`clean-select ${errors.equipo_id ? 'has-error' : ''}`}
            >
              <option value="">-- Seleccione un equipo --</option>
              {equipos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.marca} {eq.modelo} ({eq.numero_serie}) • {eq.cliente_nombre}
                </option>
              ))}
            </select>
          </div>
          {errors.equipo_id && <p className="field-error">{errors.equipo_id}</p>}

          {/* TARJETA DE VERIFICACIÓN DE EQUIPO */}
          {selectedEquipo ? (
            <div className="verification-card mt-3">
              <div className="verif-header">
                <span className="status-dot">Verificación de Equipo</span>
              </div>
              <div className="verif-rows">
                <div className="verif-row">
                  <span className="lbl">Dispositivo:</span>
                  <strong className="val">{selectedEquipo.marca} {selectedEquipo.modelo}</strong>
                </div>
                <div className="verif-row">
                  <span className="lbl">Número de Serie:</span>
                  <span className="val highlight-code">{selectedEquipo.numero_serie}</span>
                </div>
                <div className="verif-row">
                  <span className="lbl">Tipo de Equipo:</span>
                  <span className="val">{selectedEquipo.tipo_equipo}</span>
                </div>
                <div className="verif-row">
                  <span className="lbl">Cliente Titular:</span>
                  <span className="val font-bold">{selectedEquipo.cliente_nombre}</span>
                </div>
                <div className="verif-row">
                  <span className="lbl">Contacto:</span>
                  <span className="val">{selectedEquipo.cliente_telefono}</span>
                </div>
                <div className="verif-row">
                  <span className="lbl">Sistema Operativo:</span>
                  <span className="val">{selectedEquipo.sistema_operativo || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="hint mt-3">Selecciona un equipo para verificar sus datos antes de crear la orden.</p>
          )}
        </div>

        {/* PANEL DERECHO: FORMULARIO DE ORDEN DE SERVICIO */}
        <form className="details-panel" onSubmit={handleSubmit}>
          <div className="panel-heading detail-heading">
            <div>
              <p className="eyebrow">Registro de Servicio</p>
              <h2>2. Datos de la Orden</h2>
            </div>
            <span className="status-dot">Nueva Orden</span>
          </div>

          <div className="form-grid">
            <label className="full-width">
              Motivo de Ingreso / Falla Reportada *
              <textarea
                name="motivo_ingreso"
                rows={3}
                value={formData.motivo_ingreso}
                onChange={handleChange}
                placeholder="Describa la falla o servicio solicitado por el cliente..."
                required
              />
              {errors.motivo_ingreso && <span className="field-error">{errors.motivo_ingreso}</span>}
            </label>

            <label>
              Tipo de Servicio *
              <select
                name="tipo_servicio"
                value={formData.tipo_servicio}
                onChange={handleChange}
                className="select-dark"
              >
                <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                <option value="Mantenimiento Correctivo">Mantenimiento Correctivo</option>
                <option value="Diagnóstico Técnico">Diagnóstico Técnico</option>
                <option value="Garantía">Garantía</option>
                <option value="Instalación Hardware/Software">Instalación Hardware/Software</option>
              </select>
            </label>

            <label>
              Prioridad de Atención
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className="select-dark"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </label>

            <label>
              Técnico Asignado (Opcional)
              <select
                name="tecnico_id"
                value={formData.tecnico_id}
                onChange={handleChange}
                className="select-dark"
              >
                <option value="">-- Sin asignar --</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.rol})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Costo Estimado ($ COP)
              <input
                type="number"
                name="costo_estimado"
                min="0"
                step="1000"
                value={formData.costo_estimado}
                onChange={handleChange}
                placeholder="Ej. 120000"
              />
            </label>

            <label>
              Abono Inicial ($ COP)
              <input
                type="number"
                name="abono_inicial"
                min="0"
                step="1000"
                value={formData.abono_inicial}
                onChange={handleChange}
                placeholder="Ej. 50000"
              />
            </label>

            <label className="full-width">
              Observaciones de Recepción
              <input
                name="observaciones_recepcion"
                value={formData.observaciones_recepcion}
                onChange={handleChange}
                placeholder="Accesorios entregados, condiciones de entrega..."
              />
            </label>
          </div>

          <div className="form-footer">
            <p className="protection-note">
              <span aria-hidden="true">◈</span> Al crear la orden se generará un código correlativo único en el sistema.
            </p>
            <button className="save-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Crear Orden de Servicio'} <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
