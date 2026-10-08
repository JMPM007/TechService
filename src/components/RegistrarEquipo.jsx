import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function RegistrarEquipo({ onEquipoRegistrado, onIrAFicha }) {
  const [clientes, setClientes] = useState([])
  const [formData, setFormData] = useState({
    cliente_id: '',
    tipo_equipo: 'Portátil',
    marca: '',
    modelo: '',
    numero_serie: '',
    procesador: '',
    memoria_ram: '',
    almacenamiento: '',
    tarjeta_grafica: '',
    sistema_operativo: 'Windows 11 Pro 64-bit',
    estado_fisico: '',
    accesorios: '',
    observaciones: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successResult, setSuccessResult] = useState(null)
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    async function loadClientes() {
      try {
        const data = await api.getClientes()
        const list = Array.isArray(data) ? data : (data.clientes || [])
        setClientes(list)
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, cliente_id: list[0].id }))
        }
      } catch (err) {
        console.error('Error al cargar clientes:', err)
      }
    }
    loadClientes()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.cliente_id) newErrors.cliente_id = 'Debe seleccionar un cliente propietario.'
    if (!formData.tipo_equipo.trim()) newErrors.tipo_equipo = 'El tipo de equipo es obligatorio.'
    if (!formData.marca.trim()) newErrors.marca = 'La marca es obligatoria.'
    if (!formData.modelo.trim()) newErrors.modelo = 'El modelo es obligatorio.'
    if (!formData.numero_serie.trim()) newErrors.numero_serie = 'El número de serie es obligatorio.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setSuccessResult(null)

    if (!validate()) return

    try {
      setIsSubmitting(true)
      const res = await api.createEquipo(formData)
      setSuccessResult(res)
      if (onEquipoRegistrado) {
        onEquipoRegistrado(res.equipo)
      }
    } catch (err) {
      console.error('Error al registrar equipo:', err)
      setGeneralError(err.message || 'Error al registrar el equipo')
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
          <strong>¡Dispositivo Registrado con Éxito!</strong>
          <p>
            El equipo {successResult.equipo.marca} {successResult.equipo.modelo} (S/N: {successResult.equipo.numero_serie}) ya está registrado.
          </p>
          <div className="mt-2">
            <button
              type="button"
              className="save-button"
              onClick={() => onIrAFicha && onIrAFicha(successResult.equipo.id)}
            >
              Consultar en Ficha Técnica <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      <section className="workspace" aria-label="Recepción de equipos">
        {/* PANEL IZQUIERDO: CLIENTE Y DATOS GENERALES */}
        <div className="search-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Recepción Técnica</p>
              <h2>1. Datos del Propietario</h2>
            </div>
          </div>

          <label htmlFor="cliente_id">Cliente Propietario *</label>
          <div className="select-field-wrap">
            <select
              id="cliente_id"
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              className={`clean-select ${errors.cliente_id ? 'has-error' : ''}`}
            >
              <option value="">Seleccione cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (C.C. {c.cedula}) - Tel: {c.telefono}
                </option>
              ))}
            </select>
          </div>
          {errors.cliente_id && <p className="field-error">{errors.cliente_id}</p>}

          <div className="mt-4">
            <label>Tipo de Dispositivo *</label>
            <div className="select-field-wrap">
              <select
                name="tipo_equipo"
                value={formData.tipo_equipo}
                onChange={handleChange}
                className="clean-select"
              >
                <option value="Portátil">Portátil / Laptop</option>
                <option value="Portátil Gamer">Portátil Gamer</option>
                <option value="Computador de Mesa">Computador de Mesa (PC)</option>
                <option value="Todo en Uno (All-in-One)">Todo en Uno</option>
                <option value="Servidor">Servidor</option>
                <option value="Tablet">Tablet</option>
                <option value="Impresora / Periférico">Impresora / Periférico</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label>Número de Serie / Service Tag *</label>
            <div className="search-field">
              <input
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="Ej. SN-LEN-88231"
              />
            </div>
            {errors.numero_serie && <p className="field-error">{errors.numero_serie}</p>}
          </div>
        </div>

        {/* PANEL DERECHO: ESPECIFICACIONES Y ESTADO */}
        <form className="details-panel" onSubmit={handleSubmit}>
          <div className="panel-heading detail-heading">
            <div>
              <p className="eyebrow">Ficha de Recepción</p>
              <h2>2. Especificaciones y Estado</h2>
            </div>
            <span className="status-dot">Recepción</span>
          </div>

          <div className="form-grid">
            <label>
              Marca *
              <input
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Ej. Lenovo, HP, Asus"
                required
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
                required
              />
              {errors.modelo && <span className="field-error">{errors.modelo}</span>}
            </label>

            <label>
              Procesador (CPU)
              <input
                name="procesador"
                value={formData.procesador}
                onChange={handleChange}
                placeholder="Ej. AMD Ryzen 7 5700U"
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
                placeholder="Ej. 512 GB NVMe SSD"
              />
            </label>

            <label>
              Tarjeta Gráfica
              <input
                name="tarjeta_grafica"
                value={formData.tarjeta_grafica}
                onChange={handleChange}
                placeholder="Ej. NVIDIA RTX 3060"
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

            <label className="full-width">
              Estado Físico / Estético
              <input
                name="estado_fisico"
                value={formData.estado_fisico}
                onChange={handleChange}
                placeholder="Detalle de rayones, bisagras, teclado..."
              />
            </label>

            <label className="full-width">
              Accesorios Incluidos
              <input
                name="accesorios"
                value={formData.accesorios}
                onChange={handleChange}
                placeholder="Cargador original, cable de poder..."
              />
            </label>
          </div>

          <div className="form-footer">
            <p className="protection-note">
              <span aria-hidden="true">◈</span> El equipo quedará disponible de inmediato para consulta técnica y apertura de órdenes.
            </p>
            <button className="save-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Equipo'} <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
