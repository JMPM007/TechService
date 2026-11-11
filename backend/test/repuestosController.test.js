/**
 * Pruebas unitarias del controlador de repuestos (HU-25).
 * Cubre las validaciones del registro, el control de duplicados y la
 * transacción de reabastecimiento de stock. BD y modelo se simulan.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import pool from '../src/config/db.js'
import {
  ingresarReabastecimiento,
  listarRepuestos,
  registrarRepuesto,
} from '../src/controllers/repuestosController.js'
import {
  buscarRepuestoPorNombreYDescripcion,
  insertarRepuesto,
  obtenerRepuestoParaReabastecer,
  obtenerTodosRepuestos,
  sumarStockRepuesto,
} from '../src/models/repuestosModel.js'
import { mockRequest, mockResponse } from './helpers/http.js'

vi.mock('../src/config/db.js', () => ({
  default: { getConnection: vi.fn() },
}))

vi.mock('../src/models/repuestosModel.js', () => ({
  buscarRepuestoPorNombreYDescripcion: vi.fn(),
  insertarRepuesto: vi.fn(),
  obtenerRepuestoParaReabastecer: vi.fn(),
  obtenerTodosRepuestos: vi.fn(),
  sumarStockRepuesto: vi.fn(),
}))

let res

beforeEach(() => {
  res = mockResponse()
})

describe('registrarRepuesto', () => {
  const body = { nombre: ' Pantalla ', descripcion: ' 6.1 pulgadas ', stock: 5, precio_unitario: '120000' }

  test.each([
    ['nombre vacío', { ...body, nombre: '  ' }],
    ['nombre de más de 100 caracteres', { ...body, nombre: 'x'.repeat(101) }],
    ['descripción que no es texto', { ...body, descripcion: 123 }],
    ['precio ausente', { ...body, precio_unitario: undefined }],
    ['precio no numérico', { ...body, precio_unitario: 'caro' }],
    ['stock decimal', { ...body, stock: 1.5 }],
  ])('responde 400 con %s', async (_caso, datos) => {
    await registrarRepuesto(mockRequest({ body: datos }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(insertarRepuesto).not.toHaveBeenCalled()
  })

  test.each([
    ['precio negativo', { ...body, precio_unitario: -1 }],
    ['stock negativo', { ...body, stock: -3 }],
  ])('responde 400 con %s', async (_caso, datos) => {
    await registrarRepuesto(mockRequest({ body: datos }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'El precio y el stock no pueden ser negativos' })
  })

  test('responde 400 cuando ya existe un repuesto idéntico', async () => {
    buscarRepuestoPorNombreYDescripcion.mockResolvedValue({ id: 2 })

    await registrarRepuesto(mockRequest({ body }), res)

    expect(buscarRepuestoPorNombreYDescripcion).toHaveBeenCalledWith('Pantalla', '6.1 pulgadas')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(insertarRepuesto).not.toHaveBeenCalled()
  })

  test('registra el repuesto con los datos normalizados', async () => {
    buscarRepuestoPorNombreYDescripcion.mockResolvedValue(null)
    insertarRepuesto.mockResolvedValue(15)

    await registrarRepuesto(mockRequest({ body }), res)

    expect(insertarRepuesto).toHaveBeenCalledWith('Pantalla', '6.1 pulgadas', 5, 120000)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { id: 15, nombre: 'Pantalla', descripcion: '6.1 pulgadas', stock: 5, precio_unitario: 120000 },
    }))
  })

  test('usa stock 0 y descripción nula cuando no se envían', async () => {
    buscarRepuestoPorNombreYDescripcion.mockResolvedValue(null)
    insertarRepuesto.mockResolvedValue(16)

    await registrarRepuesto(mockRequest({ body: { nombre: 'Tornillo', precio_unitario: 500 } }), res)

    expect(insertarRepuesto).toHaveBeenCalledWith('Tornillo', null, 0, 500)
  })

  test('responde 500 cuando falla la base de datos', async () => {
    buscarRepuestoPorNombreYDescripcion.mockRejectedValue(new Error('BD caída'))

    await registrarRepuesto(mockRequest({ body }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('listarRepuestos', () => {
  test('devuelve el inventario', async () => {
    obtenerTodosRepuestos.mockResolvedValue([{ id: 1, nombre: 'Pantalla' }])

    await listarRepuestos(mockRequest(), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 1, nombre: 'Pantalla' }] }))
  })

  test('responde 500 cuando falla la consulta', async () => {
    obtenerTodosRepuestos.mockRejectedValue(new Error('BD caída'))

    await listarRepuestos(mockRequest(), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('ingresarReabastecimiento', () => {
  let conexion

  beforeEach(() => {
    conexion = {
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    }
    pool.getConnection.mockResolvedValue(conexion)
  })

  test.each([
    ['id inválido', { repuesto_id: 'x', cantidad: 2 }],
    ['cantidad cero', { repuesto_id: 1, cantidad: 0 }],
    ['cantidad decimal', { repuesto_id: 1, cantidad: 1.5 }],
  ])('responde 400 con %s sin abrir conexión', async (_caso, body) => {
    await ingresarReabastecimiento(mockRequest({ body }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(pool.getConnection).not.toHaveBeenCalled()
  })

  test('revierte la transacción cuando el repuesto no existe', async () => {
    obtenerRepuestoParaReabastecer.mockResolvedValue(null)

    await ingresarReabastecimiento(mockRequest({ body: { repuesto_id: 1, cantidad: 3 } }), res)

    expect(conexion.rollback).toHaveBeenCalledOnce()
    expect(conexion.release).toHaveBeenCalledOnce()
    expect(sumarStockRepuesto).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('suma el stock y confirma la transacción', async () => {
    obtenerRepuestoParaReabastecer.mockResolvedValue({ nombre: 'Pantalla', stock: 4 })

    await ingresarReabastecimiento(mockRequest({ body: { repuesto_id: 1, cantidad: '3' } }), res)

    expect(sumarStockRepuesto).toHaveBeenCalledWith(1, '3', conexion)
    expect(conexion.commit).toHaveBeenCalledOnce()
    expect(conexion.release).toHaveBeenCalledOnce()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { repuesto_id: 1, nombre: 'Pantalla', stock_anterior: 4, cantidad_agregada: 3, stock_actual: 7 },
    }))
  })

  test('revierte la transacción y responde 500 cuando falla la actualización', async () => {
    obtenerRepuestoParaReabastecer.mockResolvedValue({ nombre: 'Pantalla', stock: 4 })
    sumarStockRepuesto.mockRejectedValue(new Error('BD caída'))

    await ingresarReabastecimiento(mockRequest({ body: { repuesto_id: 1, cantidad: 3 } }), res)

    expect(conexion.commit).not.toHaveBeenCalled()
    expect(conexion.rollback).toHaveBeenCalledOnce()
    expect(conexion.release).toHaveBeenCalledOnce()
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
