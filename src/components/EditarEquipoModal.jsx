import React, { useState } from 'react'
import { api } from '../services/api'

export default function EditarEquipoModal({ equipo, onClose, onEquipoActualizado }) {
  const [formData, setFormData] = useState({
    tipo_equipo: equipo?.tipo_equipo || '',
    marca: equipo?.marca || '',
    modelo: equipo?.modelo || '',
    numero_serie: equipo?.numero_serie || '',
    procesador: equipo?.procesador || '',
    memoria_ram: equipo?.memoria_ram || '',
    almacenamiento: equipo?.almacenamiento || '',
    tarjeta_grafica: equipo?.tarjeta_grafica || '',
    sistema_operativo: equipo?.sistema_operativo || '',
    estado_fisico: equipo?.estado_fisico || '',
    accesorios: equipo?.accesorios || '',
    observaciones: equipo?.observaciones || ''
  })

  const [errors, setErrors] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.tipo_equipo.trim()) newErrors.tipo_equipo = 'El tipo de equipo es obligatorio.'
    if (!formData.marca.trim()) newErrors.marca = 'La marca es obligatoria.'
    if (!formData.modelo.trim()) newErrors.modelo = 'El modelo es obligatorio.'
    if (!formData.numero_serie.trim()) newErrors.numero_serie = 'El número de serie es obligatorio.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePreSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!validateForm()) return
    setShowConfirmModal(true)
  }

  const handleConfirmSave = async () => {
    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const response = await api.updateEquipo(equipo.id, formData)
      setShowConfirmModal(false)
      if (onEquipoActualizado) {
        onEquipoActualizado(response.equipo, response.mensaje)
      }
      onClose()
    } catch (error) {
      setIsSubmitting(false)
      setShowConfirmModal(false)
      setErrorMessage(error.message || 'Error al actualizar las características del equipo')
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Ficha Técnica</p>
            <h3>Editar Características del Equipo</h3>
            <p className="modal-subtitle">
              Equipo #{equipo.id} • Propietario: {equipo.cliente_nombre}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="feedback-banner error">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="modal-body">
          {/* IDENTIFICACIÓN BÁSICA */}
          <div className="modal-section-title">Identificación General</div>
          <div className="form-grid modal-grid">
            <label>
              Tipo de Dispositivo *
              <select
                name="tipo_equipo"
                value={formData.tipo_equipo}
                onChange={handleChange}
                className={errors.tipo_equipo ? 'has-error' : ''}
              >
                <option value="">Seleccione tipo...</option>
                <option value="Portátil">Portátil / Laptop</option>
                <option value="Portátil Gamer">Portátil Gamer</option>
                <option value="Computador de Mesa">Computador de Mesa</option>
                <option value="Todo en Uno (All-in-One)">Todo en Uno</option>
                <option value="Servidor">Servidor</option>
                <option value="Tablet">Tablet</option>
                <option value="Impresora / Periférico">Impresora / Periférico</option>
              </select>
              {errors.tipo_equipo && <span className="field-error">{errors.tipo_equipo}</span>}
            </label>

            <label>
              Marca *
              <input
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Ej. Lenovo, Asus, Dell"
                className={errors.marca ? 'has-error' : ''}
              />
              {errors.marca && <span className="field-error">{errors.marca}</span>}
            </label>

            <label>
              Modelo *
              <input
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej. ThinkPad T14"
                className={errors.modelo ? 'has-error' : ''}
              />
              {errors.modelo && <span className="field-error">{errors.modelo}</span>}
            </label>

            <label>
              Número de Serie *
              <input
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="S/N o Service Tag"
                className={errors.numero_serie ? 'has-error' : ''}
              />
              {errors.numero_serie && <span className="field-error">{errors.numero_serie}</span>}
            </label>
          </div>

          {/* ESPECIFICACIONES DE HARDWARE & SOFTWARE */}
          <div className="modal-section-title mt-3">Especificaciones Técnicas</div>
          <div className="form-grid modal-grid">
            <label>
              Procesador (CPU)
              <input
                name="procesador"
                value={formData.procesador}
                onChange={handleChange}
                placeholder="Ej. Intel Core i7-1165G7"
              />
            </label>

            <label>
              Memoria RAM
              <input
                name="memoria_ram"
                value={formData.memoria_ram}
                onChange={handleChange}
                placeholder="Ej. 16 GB DDR4"
              />
            </label>

            <label>
              Almacenamiento
              <input
                name="almacenamiento"
                value={formData.almacenamiento}
                onChange={handleChange}
                placeholder="Ej. 512 GB SSD NVMe"
              />
            </label>

            <label>
              Tarjeta Gráfica (GPU)
              <input
                name="tarjeta_grafica"
                value={formData.tarjeta_grafica}
                onChange={handleChange}
                placeholder="Ej. NVIDIA RTX 3060 / Integrada"
              />
            </label>

            <label className="full-width">
              Sistema Operativo
              <input
                name="sistema_operativo"
                value={formData.sistema_operativo}
                onChange={handleChange}
                placeholder="Ej. Windows 11 Pro 64-bit"
              />
            </label>
          </div>

          {/* ESTADO FÍSICO Y OBSERVACIONES */}
          <div className="modal-section-title mt-3">Estado Físico & Accesorios</div>
          <div className="form-grid modal-grid">
            <label className="full-width">
              Estado Físico / Estético
              <input
                name="estado_fisico"
                value={formData.estado_fisico}
                onChange={handleChange}
                placeholder="Detalle de rayones, bisagras, teclado, etc."
              />
            </label>

            <label className="full-width">
              Accesorios Incluidos
              <input
                name="accesorios"
                value={formData.accesorios}
                onChange={handleChange}
                placeholder="Ej. Cargador original, funda, mouse"
              />
            </label>

            <label className="full-width">
              Observaciones Técnicas
              <textarea
                name="observaciones"
                rows={2}
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Notas técnicas adicionales..."
              />
            </label>
          </div>

          <div className="form-footer mt-4">
            <button type="button" className="btn-secondary-green" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="save-button" disabled={isSubmitting}>
              Guardar cambios <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>

        {/* DIÁLOGO DE CONFIRMACIÓN */}
        {showConfirmModal && (
          <div className="confirm-overlay">
            <div className="confirm-dialog">
              <div className="placeholder-icon">◈</div>
              <h4>¿Confirmar actualización?</h4>
              <p>
                ¿Deseas guardar los cambios realizados en las características del equipo{' '}
                <strong>{formData.marca} {formData.modelo} ({formData.numero_serie})</strong>?
              </p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-secondary-green"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar y Revisar
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={handleConfirmSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Sí, Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
