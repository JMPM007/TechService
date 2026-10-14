import {
    countOrdersByStatus,
    findClientOrderByCode,
    findOrderStatusHistory,
    searchGlobal,
} from '../models/consultaModel.js'

const ORDER_STATUSES = [
    'RECIBIDA',
    'PENDIENTE',
    'EN_REVISION',
    'EN_REPARACION',
    'EN_PROCESO',
    'EN_ESPERA_REPUESTO',
    'REPARADA',
    'COMPLETADO',
    'ENTREGADA',
    'CANCELADA',
]

// HU-27: el cliente consulta una orden por código (solo las suyas)
export async function consultarOrdenPorCodigo(req, res) {
    const codigo = typeof req.params.codigo === 'string'
    ? req.params.codigo.trim()
    : ''

    if (!codigo || codigo.length > 30) {
    return res.status(400).json({
        mensaje: 'El código de la orden es obligatorio.',
    })
    }

    try {
    const orden = await findClientOrderByCode(codigo, req.user.id)

    if (!orden) {
      return res.status(404).json({
        mensaje: 'No se encontró ninguna orden con ese código asociada a tu cuenta.',
      })
    }

    const historial = await findOrderStatusHistory(orden.id)

    return res.json({
      orden: {
        codigoOrden: orden.codigoOrden,
        estado: orden.estado,
        fechaIngreso: orden.fechaIngreso,
        equipo: {
          tipo: orden.tipo,
          marca: orden.marca,
          modelo: orden.modelo,
        },
        tecnico: orden.tecnicoNombre ?? null,
      },
      historial,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      mensaje: 'Ocurrió un error al consultar la orden.',
    })
  }
}

export async function consultarDashboardOrdenes(req, res) {
    try {
    const rows = await countOrdersByStatus()
    const counts = new Map(rows.map((row) => [row.estado, Number(row.cantidad)]))

    const estados = ORDER_STATUSES.map((estado) => ({
        estado,
        cantidad: counts.get(estado) ?? 0,
    }))
    const total = estados.reduce((sum, item) => sum + item.cantidad, 0)

    return res.json({ total, estados })
    } catch (error) {
    console.error(error)
    return res.status(500).json({
        mensaje: 'Ocurrió un error al cargar el dashboard.',
    })
    }
}


export async function buscarGlobal(req, res) {
    const termino = typeof req.query.q === 'string' ? req.query.q.trim() : ''

    if (!termino || termino.length > 100) {
    return res.status(400).json({
            mensaje: 'Ingresa una cédula, un número de serie o un código de orden para buscar.',
    })
    }

    try {
    const resultados = await searchGlobal(termino)

    return res.json({
        termino,
        total: resultados.length,
        resultados,
    })
    } catch (error) {
    console.error(error)
    return res.status(500).json({
        mensaje: 'Ocurrió un error al realizar la búsqueda.',
    })
    }
}