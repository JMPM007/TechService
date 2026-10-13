import { apiRequest } from "./api";

export async function registrarRepuestoService(repuesto) {
    return apiRequest("/ordenes-repuestos/nuevorepuesto", {
        method: "POST",
        body: JSON.stringify({
            ...repuesto,
            stock: Number(repuesto.stock),
            precio_unitario: Number(
                repuesto.precio_unitario.replace(/\./g, "").replace(",", ".")
            )
        })
    })
}

export async function registrarReabastecimientoService(repuesto_id, cantidad) {
    return apiRequest("/ordenes-repuestos/reabastecimiento", {
        method: "POST",
        body: JSON.stringify({
            repuesto_id: Number(repuesto_id),
            cantidad: Number(cantidad)
        })
    })
}

export async function obtenerInventarioService() {
    return apiRequest("/ordenes-repuestos/inventario", {
        method: "GET"
    })
}