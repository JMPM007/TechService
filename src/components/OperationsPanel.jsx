import { useEffect, useState } from 'react'
import {
  createServiceOrder,
  assignOrderToTechnician,
  getEquipmentList,
  getServiceOrders,
  getTechnicians,
  registerEquipment,
  registerTechnician,
  updateEquipment,
  updateOrderStatus,
  updateTechnicianStatus,
} from '../services/operationsService'

const emptyEquipment = {
  cedula: '',
  tipo: '',
  marca: '',
  modelo: '',
  numero_serie: '',
}

const emptyTechnician = {
  nombre: '',
  email: '',
  password: '',
  cedula: '',
  telefono: '',
  especialidad: '',
}

const emptyEditEquipment = {
  tipo: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  procesador: '',
  memoriaRam: '',
  almacenamiento: '',
  tarjetaGrafica: '',
  sistemaOperativo: '',
  estadoFisico: '',
  accesorios: '',
  observaciones: '',
}

function OperationsPanel({ profile }) {
  const [section, setSection] = useState('equipos')
  const [equipment, setEquipment] = useState([])
  const [orders, setOrders] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [equipmentForm, setEquipmentForm] = useState(emptyEquipment)
  const [editEquipment, setEditEquipment] = useState(null)
  const [technicianForm, setTechnicianForm] = useState(emptyTechnician)
  const [orderForm, setOrderForm] = useState({ equipoId: '', motivoIngreso: '', tipoServicio: 'Mantenimiento Correctivo', prioridad: 'MEDIA' })
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isAdmin = profile?.rol === 'ADMIN'

  async function loadData() {
    setLoading(true)
    try {
      const [equipmentResponse, orderResponse] = await Promise.all([getEquipmentList(search), getServiceOrders()])
      setEquipment(equipmentResponse.equipos ?? [])
      setOrders(orderResponse.ordenes ?? [])
      if (isAdmin) {
        const technicianResponse = await getTechnicians()
        setTechnicians(technicianResponse)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function initializeOperations() {
      await loadData()
    }

    initializeOperations()
    // loadData uses the current role and search state for explicit refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  function clearFeedback() {
    setMessage('')
    setError('')
  }

  async function submitEquipment(event) {
    event.preventDefault()
    clearFeedback()
    try {
      const response = await registerEquipment(equipmentForm)
      setMessage(`${response.mensaje} ID generado: #${response.equipo.id}.`)
      setEquipmentForm(emptyEquipment)
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function submitOrder(event) {
    event.preventDefault()
    clearFeedback()
    try {
      const response = await createServiceOrder(orderForm)
      setMessage(`${response.mensaje} Código: ${response.codigoOrden}`)
      setOrderForm({ equipoId: '', motivoIngreso: '', tipoServicio: 'Mantenimiento Correctivo', prioridad: 'MEDIA' })
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function saveEquipmentChanges(event) {
    event.preventDefault()
    clearFeedback()
    try {
      const response = await updateEquipment(editEquipment.id, editEquipment)
      setMessage(response.mensaje)
      setEditEquipment(null)
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function changeOrderStatus(orderId, estado) {
    clearFeedback()
    try {
      await updateOrderStatus(orderId, estado)
      setMessage('Estado de la orden actualizado.')
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function assignOrder(orderId, tecnicoId) {
    if (!tecnicoId) return
    clearFeedback()
    try {
      const response = await assignOrderToTechnician(orderId, tecnicoId)
      setMessage(response.mensaje)
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function submitTechnician(event) {
    event.preventDefault()
    clearFeedback()
    try {
      const response = await registerTechnician(technicianForm)
      setMessage(response.mensaje)
      setTechnicianForm(emptyTechnician)
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function changeTechnicianStatus(id, estado) {
    clearFeedback()
    try {
      await updateTechnicianStatus(id, estado)
      setMessage('Disponibilidad actualizada.')
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const updateEquipmentField = (event) => setEquipmentForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const updateTechnicianField = (event) => setTechnicianForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const updateOrderField = (event) => setOrderForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  return (
    <section className="operations-panel">
      <div className="module-tabs">
        <button className={section === 'equipos' ? 'module-tab active' : 'module-tab'} type="button" onClick={() => setSection('equipos')}>Equipos</button>
        <button className={section === 'ordenes' ? 'module-tab active' : 'module-tab'} type="button" onClick={() => setSection('ordenes')}>Órdenes de servicio</button>
        {isAdmin && <button className={section === 'tecnicos' ? 'module-tab active' : 'module-tab'} type="button" onClick={() => setSection('tecnicos')}>Técnicos</button>}
      </div>

      {message && <p className="alert success">{message}</p>}
      {error && <p className="alert error">{error}</p>}

      {section === 'equipos' && (
        <div className="operations-grid">
          <section className="card">
            <h2>Registrar equipo</h2>
            <form onSubmit={submitEquipment}>
              <label htmlFor="equipment-client">Cédula del cliente</label>
              <input id="equipment-client" name="cedula" value={equipmentForm.cedula} onChange={updateEquipmentField} placeholder="Escribe la cédula del cliente" required />
              <label htmlFor="equipment-type">Tipo de equipo</label>
              <input id="equipment-type" name="tipo" value={equipmentForm.tipo} onChange={updateEquipmentField} required />
              <label htmlFor="equipment-brand">Marca</label>
              <input id="equipment-brand" name="marca" value={equipmentForm.marca} onChange={updateEquipmentField} required />
              <label htmlFor="equipment-model">Modelo</label>
              <input id="equipment-model" name="modelo" value={equipmentForm.modelo} onChange={updateEquipmentField} required />
              <label htmlFor="equipment-serial">Número serial</label>
              <input id="equipment-serial" name="numero_serie" value={equipmentForm.numero_serie} onChange={updateEquipmentField} required />
              <button type="submit">Registrar equipo</button>
            </form>
          </section>
          <section className="card">
            <div className="list-heading"><div><h2>Ficha técnica</h2><p>Busca por serial, marca o modelo.</p></div><button type="button" onClick={loadData} disabled={loading}>Actualizar</button></div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadData()} placeholder="Buscar equipo" aria-label="Buscar equipo" />
            <div className="data-list">
              {equipment.map((item) => <article className="data-row" key={item.id}><div><strong>{item.marca} {item.modelo}</strong><span>{item.tipo} · Serial: {item.numeroSerie ?? item.numero_serie}</span><small>{item.procesador || 'Sin procesador registrado'} · {item.memoria_ram || 'Sin RAM registrada'}</small></div><div className="row-actions"><b>#{item.id}</b><button type="button" className="small-button" onClick={() => setEditEquipment({ ...emptyEditEquipment, ...item, numeroSerie: item.numeroSerie ?? item.numero_serie, memoriaRam: item.memoriaRam ?? item.memoria_ram })}>Editar ficha</button></div></article>)}
              {!equipment.length && <p className="empty-state">No hay equipos para mostrar.</p>}
            </div>
          </section>
          {editEquipment && <section className="card edit-card"><div className="list-heading"><div><h2>Editar ficha técnica</h2><p>Equipo #{editEquipment.id}</p></div><button type="button" className="small-button" onClick={() => setEditEquipment(null)}>Cerrar</button></div><form onSubmit={saveEquipmentChanges}><div className="form-grid-two">{[['tipo', 'Tipo'], ['marca', 'Marca'], ['modelo', 'Modelo'], ['numeroSerie', 'Número de serie'], ['procesador', 'Procesador'], ['memoriaRam', 'Memoria RAM'], ['almacenamiento', 'Almacenamiento'], ['tarjetaGrafica', 'Tarjeta gráfica'], ['sistemaOperativo', 'Sistema operativo']].map(([name, label]) => <div key={name}><label htmlFor={`edit-${name}`}>{label}</label><input id={`edit-${name}`} value={editEquipment[name] ?? ''} onChange={(event) => setEditEquipment((current) => ({ ...current, [name]: event.target.value }))} required={['tipo', 'marca', 'modelo', 'numeroSerie'].includes(name)} /></div>)}</div><label htmlFor="edit-physical-state">Estado físico</label><textarea id="edit-physical-state" value={editEquipment.estadoFisico ?? ''} onChange={(event) => setEditEquipment((current) => ({ ...current, estadoFisico: event.target.value }))} /><label htmlFor="edit-accessories">Accesorios</label><textarea id="edit-accessories" value={editEquipment.accesorios ?? ''} onChange={(event) => setEditEquipment((current) => ({ ...current, accesorios: event.target.value }))} /><label htmlFor="edit-observations">Observaciones</label><textarea id="edit-observations" value={editEquipment.observaciones ?? ''} onChange={(event) => setEditEquipment((current) => ({ ...current, observaciones: event.target.value }))} /><button type="submit">Guardar cambios</button></form></section>}
        </div>
      )}

      {section === 'ordenes' && (
        <div className="operations-grid">
          {!isAdmin && <section className="card">
            <h2>Crear orden de servicio</h2>
            <form onSubmit={submitOrder}>
              <label htmlFor="order-equipment">Equipo ID</label><input id="order-equipment" name="equipoId" type="number" min="1" value={orderForm.equipoId} onChange={updateOrderField} required />
              <label htmlFor="order-reason">Motivo de ingreso</label><textarea id="order-reason" name="motivoIngreso" value={orderForm.motivoIngreso} onChange={updateOrderField} required />
              <label htmlFor="order-type">Tipo de servicio</label><select id="order-type" name="tipoServicio" value={orderForm.tipoServicio} onChange={updateOrderField}><option>Mantenimiento Preventivo</option><option>Mantenimiento Correctivo</option><option>Diagnóstico Técnico</option><option>Garantía</option><option>Instalación Hardware/Software</option></select>
              <label htmlFor="order-priority">Prioridad</label><select id="order-priority" name="prioridad" value={orderForm.prioridad} onChange={updateOrderField}><option>BAJA</option><option>MEDIA</option><option>ALTA</option><option>URGENTE</option></select>
              <button type="submit">Crear orden</button>
            </form>
          </section>}
          <section className="card"><div className="list-heading"><div><h2>Órdenes registradas</h2><p>Consulta, asigna y actualiza el estado de cada orden.</p></div><button type="button" onClick={loadData}>Actualizar</button></div><div className="data-list">{orders.map((order) => <article className="data-row" key={order.id}><div><strong>{order.codigo_orden || `Orden #${order.id}`}</strong><span>{order.equipoMarca} {order.equipoModelo} · {order.equipoSerial}</span><small>{order.tipo_servicio || 'Sin tipo'} · Prioridad {order.prioridad} · Técnico: {order.tecnicoNombre || 'Sin asignar'}</small></div><div className="order-actions"><select className="status-select" value={order.estado} onChange={(event) => changeOrderStatus(order.id, event.target.value)}><option value="PENDIENTE">Pendiente</option><option value="EN_PROCESO">En proceso</option><option value="EN_ESPERA_REPUESTO">En espera de repuesto</option><option value="COMPLETADO">Completado</option><option value="ENTREGADA">Entregada</option><option value="CANCELADO">Cancelada</option><option value="RECIBIDA">Recibida</option><option value="EN_REVISION">En revisión</option><option value="EN_REPARACION">En reparación</option><option value="REPARADA">Reparada</option></select>{isAdmin && <select className="status-select" value={order.tecnicoId ?? ''} onChange={(event) => assignOrder(order.id, event.target.value)}><option value="">Asignar técnico</option>{technicians.map((technician) => <option key={technician.tecnico_id} value={technician.tecnico_id}>{technician.nombre}</option>)}</select>}</div></article>)}{!orders.length && <p className="empty-state">No hay órdenes para mostrar.</p>}</div></section>
        </div>
      )}

      {section === 'tecnicos' && isAdmin && <section className="operations-grid"><section className="card"><h2>Registrar técnico</h2><form onSubmit={submitTechnician}>{Object.entries({ nombre: 'Nombre', email: 'Correo', password: 'Contraseña', cedula: 'Cédula', telefono: 'Teléfono', especialidad: 'Especialidad' }).map(([name, label]) => <div key={name}><label htmlFor={`technician-${name}`}>{label}</label><input id={`technician-${name}`} name={name} type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'} value={technicianForm[name]} onChange={updateTechnicianField} required /></div>)}<button type="submit">Registrar técnico</button></form></section><section className="card"><h2>Disponibilidad</h2><div className="data-list">{technicians.map((technician) => <article className="data-row" key={technician.tecnico_id}><div><strong>{technician.nombre}</strong><span>{technician.especialidad} · {technician.telefono}</span><small>{technician.email}</small></div><select value={technician.estado} onChange={(event) => changeTechnicianStatus(technician.tecnico_id, event.target.value)}><option>DISPONIBLE</option><option>OCUPADO</option><option>INACTIVO</option></select></article>)}</div></section></section>}
    </section>
  )
}

export default OperationsPanel
