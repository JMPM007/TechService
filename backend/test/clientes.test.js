import test from "node:test"
import assert from "node:assert/strict"
import { createClientesController } from "../src/controllers/clientes.js"

function responseDouble() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this },
        json(body) { this.body = body; return this }
    }
}

test("busca clientes por documento o nombre", async () => {
    const calls = []
    const database = { query: async (sql, params) => {
        calls.push({ sql, params })
        return [[{ id: 1, cedula: "100123456", nombre: "Juan Barrios" }]]
    } }
    const response = responseDouble()

    await createClientesController(database).list({ query: { search: "Juan" } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body[0].nombre, "Juan Barrios")
    assert.deepEqual(calls[0].params, ["%Juan%", "%Juan%"])
})

test("actualiza datos de contacto sin incluir la identificacion", async () => {
    const queries = []
    const database = { query: async (sql, params) => {
        queries.push({ sql, params })
        if (sql.startsWith("SELECT id, cedula")) return [[{ id: 1, cedula: "100123456" }]]
        if (sql.startsWith("SELECT id, cedula, nombre")) return [[{ id: 1, cedula: "100123456", nombre: "Juan Nuevo" }]]
        return [[]]
    } }
    const response = responseDouble()

    await createClientesController(database).update(
        { params: { id: "1" }, body: { cedula: "100123456", nombre: "Juan Nuevo", telefono: "3000000000" } },
        response
    )

    assert.equal(response.statusCode, 200)
    assert.match(queries[1].sql, /nombre = \?, telefono = \?/)
    assert.doesNotMatch(queries[1].sql, /cedula/)
})

test("bloquea el cambio de identificacion cuando existen trabajos", async () => {
    const database = { query: async (sql) => {
        if (sql.startsWith("SELECT id, cedula")) return [[{ id: 1, cedula: "100123456" }]]
        return [[{ id: 44 }]]
    } }
    const response = responseDouble()

    await createClientesController(database).update(
        { params: { id: "1" }, body: { cedula: "999999999", telefono: "3000000000" } },
        response
    )

    assert.equal(response.statusCode, 409)
    assert.match(response.body.error, /trabajos/)
})
