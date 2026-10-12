import { useCallback, useEffect, useState } from 'react'
import { agregarRepuestoAOrdenService } from '../services/ordenRepuestosServices'
import {
  obtenerInventarioService,
  registrarReabastecimientoService,
  registrarRepuestoService,
} from '../services/repuestosService'

const initialOrderForm = {
  ordenId: '',
  repuestoId: '',
  cantidad: '1',
}

const initialPartForm = {
  nombre: '',
  descripcion: '',
  stock: '0',
  precio_unitario: '',
}

const initialRestockForm = {
  repuestoId: '',
  cantidad: '1',
}

function formatPriceInput(value) {
  const [integerPart, ...decimalParts] = value.replace(/[^\d,]/g, '').split(',')
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  if (decimalParts.length === 0) {
    return groupedInteger
  }

  return `${groupedInteger},${decimalParts.join('').slice(0, 2)}`
}

function formatCurrency(value) {
  return `$${Number(value).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function RepuestosPanel() {
  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState('')
  const [orderForm, setOrderForm] = useState(initialOrderForm)
  const [partForm, setPartForm] = useState(initialPartForm)
  const [restockForm, setRestockForm] = useState(initialRestockForm)
  const [orderLoading, setOrderLoading] = useState(false)
  const [partLoading, setPartLoading] = useState(false)
  const [restockLoading, setRestockLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [partError, setPartError] = useState('')
  const [restockError, setRestockError] = useState('')
  const [orderResult, setOrderResult] = useState(null)
  const [partResult, setPartResult] = useState(null)
  const [restockResult, setRestockResult] = useState(null)

  const loadInventory = useCallback(async () => {
    setInventoryLoading(true)
    setInventoryError('')

    try {
      const response = await obtenerInventarioService()
      setInventory(response.data)
    } catch (requestError) {
      setInventoryError(requestError.message)
    } finally {
      setInventoryLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInventory()
  }, [loadInventory])

  function updateOrderField(event) {
    setOrderForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updatePartField(event) {
    const { name, value } = event.target
    setPartForm((current) => ({
      ...current,
      [name]: name === 'precio_unitario' ? formatPriceInput(value) : value,
    }))
  }

  function updateRestockField(event) {
    setRestockForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitPart(event) {
    event.preventDefault()
    setPartLoading(true)
    setPartError('')
    setPartResult(null)

    try {
      const response = await registrarRepuestoService(partForm)
      setPartResult(response.data)
      setInventory((current) => [...current, response.data].sort((a, b) => a.id - b.id))
      setPartForm(initialPartForm)
    } catch (requestError) {
      setPartError(requestError.message)
    } finally {
      setPartLoading(false)
    }
  }

  async function submitRestock(event) {
    event.preventDefault()
    setRestockLoading(true)
    setRestockError('')
    setRestockResult(null)

    try {
      const response = await registrarReabastecimientoService(
        restockForm.repuestoId,
        restockForm.cantidad,
      )
      const updatedPart = response.data
      setRestockResult(updatedPart)
      setInventory((current) => current.map((part) => (
        part.id === Number(updatedPart.repuesto_id)
          ? { ...part, stock: updatedPart.stock_actual }
          : part
      )))
      setRestockForm(initialRestockForm)
    } catch (requestError) {
      setRestockError(requestError.message)
    } finally {
      setRestockLoading(false)
    }
  }

  async function submitOrder(event) {
    event.preventDefault()
    setOrderLoading(true)
    setOrderError('')
    setOrderResult(null)

    try {
      const response = await agregarRepuestoAOrdenService(
        orderForm.ordenId,
        orderForm.repuestoId,
        orderForm.cantidad,
      )
      const usedPart = response.data
      setOrderResult(usedPart)
      setInventory((current) => current.map((part) => (
        part.id === Number(usedPart.repuesto_id)
          ? { ...part, stock: Number(part.stock) - Number(usedPart.cantidad) }
          : part
      )))
      setOrderForm(initialOrderForm)
    } catch (requestError) {
      setOrderError(requestError.message)
    } finally {
      setOrderLoading(false)
    }
  }

  const totalUnits = inventory.reduce((total, part) => total + Number(part.stock), 0)
  const lowStockCount = inventory.filter((part) => Number(part.stock) <= 5).length

  return (
    <div className="repuestos-panel">
      <section className="card inventory-section" aria-labelledby="inventory-heading">
        <div className="list-heading">
          <div>
            <h2 id="inventory-heading">Inventario</h2>
            <p>Resumen de existencias y precio unitario de cada repuesto.</p>
          </div>
          <button type="button" onClick={loadInventory} disabled={inventoryLoading}>
            {inventoryLoading ? 'Actualizando...' : 'Actualizar inventario'}
          </button>
        </div>

        <div className="inventory-summary" aria-label="Resumen del inventario">
          <div className="inventory-stat">
            <span>Tipos de repuesto</span>
            <strong>{inventory.length}</strong>
          </div>
          <div className="inventory-stat">
            <span>Unidades disponibles</span>
            <strong>{totalUnits.toLocaleString('es-CO')}</strong>
          </div>
          <div className="inventory-stat inventory-stat-warning">
            <span>Stock bajo (5 o menos)</span>
            <strong>{lowStockCount}</strong>
          </div>
        </div>

        {inventoryError && <p className="alert error" role="alert">{inventoryError}</p>}
        {inventoryLoading && <p className="inventory-message">Cargando inventario...</p>}
        {!inventoryLoading && !inventoryError && inventory.length === 0 && (
          <p className="inventory-message">Todavía no hay repuestos en el inventario.</p>
        )}
        {!inventoryLoading && !inventoryError && inventory.length > 0 && (
          <div className="inventory-card-grid">
            {inventory.map((part) => (
              <article className="inventory-item" key={part.id}>
                <div className="inventory-item-heading">
                  <div>
                    <span className="inventory-item-id">Repuesto #{part.id}</span>
                    <h3>{part.nombre}</h3>
                  </div>
                  <span className={`stock-badge${Number(part.stock) <= 5 ? ' low' : ''}`}>
                    {Number(part.stock) <= 5 ? 'Stock bajo' : 'Disponible'}
                  </span>
                </div>
                {part.descripcion && <p className="inventory-description">{part.descripcion}</p>}
                <div className="inventory-item-details">
                  <div>
                    <span>Existencias</span>
                    <strong>{Number(part.stock).toLocaleString('es-CO')} unidades</strong>
                  </div>
                  <div>
                    <span>Precio unitario</span>
                    <strong>{formatCurrency(part.precio_unitario)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="repuestos-actions" aria-label="Acciones de inventario">
        <section className="card repuestos-action-card">
          <h2>Registrar repuesto</h2>
          <p>Da de alta una pieza nueva con su stock inicial.</p>
          {partError && <p className="alert error" role="alert">{partError}</p>}
          {partResult && (
            <p className="alert success" role="status">
              {partResult.nombre} se agregó al inventario (ID {partResult.id}).
            </p>
          )}
          <form onSubmit={submitPart}>
            <label htmlFor="nuevo-repuesto-nombre">Nombre</label>
            <input
              id="nuevo-repuesto-nombre"
              name="nombre"
              value={partForm.nombre}
              onChange={updatePartField}
              maxLength="100"
              required
            />

            <label htmlFor="nuevo-repuesto-descripcion">Descripción</label>
            <textarea
              id="nuevo-repuesto-descripcion"
              name="descripcion"
              value={partForm.descripcion}
              onChange={updatePartField}
              rows="2"
            />

            <div className="repuestos-field-row">
              <div>
                <label htmlFor="nuevo-repuesto-stock">Stock inicial</label>
                <input
                  id="nuevo-repuesto-stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={partForm.stock}
                  onChange={updatePartField}
                  required
                />
              </div>
              <div>
                <label htmlFor="nuevo-repuesto-precio">Precio unitario ($)</label>
                <input
                  id="nuevo-repuesto-precio"
                  name="precio_unitario"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={partForm.precio_unitario}
                  onChange={updatePartField}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={partLoading}>
              {partLoading ? 'Registrando...' : 'Agregar al inventario'}
            </button>
          </form>
        </section>

        <section className="card repuestos-action-card">
          <h2>Reabastecer stock</h2>
          <p>Registra una entrada de unidades para un repuesto existente.</p>
          {restockError && <p className="alert error" role="alert">{restockError}</p>}
          {restockResult && (
            <p className="alert success" role="status">
              {restockResult.nombre}: {restockResult.stock_anterior} +{' '}
              {restockResult.cantidad_agregada} = {restockResult.stock_actual} unidades.
            </p>
          )}
          <form onSubmit={submitRestock}>
            <label htmlFor="reabastecimiento-repuesto-id">Repuesto</label>
            <select
              id="reabastecimiento-repuesto-id"
              name="repuestoId"
              value={restockForm.repuestoId}
              onChange={updateRestockField}
              required
              disabled={inventoryLoading || inventory.length === 0}
            >
              <option value="">Selecciona un repuesto</option>
              {inventory.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.nombre} · stock {part.stock}
                </option>
              ))}
            </select>

            <label htmlFor="reabastecimiento-cantidad">Unidades a ingresar</label>
            <input
              id="reabastecimiento-cantidad"
              name="cantidad"
              type="number"
              min="1"
              step="1"
              value={restockForm.cantidad}
              onChange={updateRestockField}
              required
            />
            <button type="submit" disabled={restockLoading || inventory.length === 0}>
              {restockLoading ? 'Registrando...' : 'Registrar reabastecimiento'}
            </button>
          </form>
        </section>

        <section className="card repuestos-action-card">
          <h2>Usar en una orden</h2>
          <p>Asocia un repuesto a una orden; las unidades se descuentan del stock.</p>
          {orderError && <p className="alert error" role="alert">{orderError}</p>}
          {orderResult && (
            <p className="alert success" role="status">
              Repuesto agregado. Subtotal: {formatCurrency(orderResult.subtotal)}.
            </p>
          )}
          <form onSubmit={submitOrder}>
            <label htmlFor="repuesto-orden-id">ID de orden</label>
            <input
              id="repuesto-orden-id"
              name="ordenId"
              type="number"
              min="1"
              step="1"
              value={orderForm.ordenId}
              onChange={updateOrderField}
              required
            />

            <label htmlFor="repuesto-id">Repuesto</label>
            <select
              id="repuesto-id"
              name="repuestoId"
              value={orderForm.repuestoId}
              onChange={updateOrderField}
              required
              disabled={inventoryLoading || inventory.length === 0}
            >
              <option value="">Selecciona un repuesto</option>
              {inventory.map((part) => (
                <option key={part.id} value={part.id} disabled={Number(part.stock) === 0}>
                  {part.nombre} · stock {part.stock}
                </option>
              ))}
            </select>

            <label htmlFor="repuesto-cantidad">Cantidad</label>
            <input
              id="repuesto-cantidad"
              name="cantidad"
              type="number"
              min="1"
              step="1"
              value={orderForm.cantidad}
              onChange={updateOrderField}
              required
            />
            <button type="submit" disabled={orderLoading || inventory.length === 0}>
              {orderLoading ? 'Agregando...' : 'Agregar repuesto a orden'}
            </button>
          </form>
        </section>
      </section>
    </div>
  )
}
