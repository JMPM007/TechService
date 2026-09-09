const editableFields = ["nombre", "direccion", "telefono", "email"]

export function createClientesController(database) {
    return {
        async create(req, res) {
            const { cedula, nombre, direccion = null, telefono, email = null } = req.body ?? {}

            if (!cedula || !nombre || !telefono) {
                return res.status(400).json({
                    error: "Cedula, nombre y telefono son obligatorios"
                })
            }

            try {
                const [result] = await database.query(
                    `INSERT INTO clientes (cedula, nombre, direccion, telefono, email)
                     VALUES (?, ?, ?, ?, ?)`,
                    [cedula, nombre, direccion, telefono, email]
                )

                const [clients] = await database.query(
                    "SELECT id, cedula, nombre, direccion, telefono, email FROM clientes WHERE id = ?",
                    [result.insertId]
                )

                return res.status(201).json(clients[0])
            } catch (error) {
                if (error.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({ error: "La identificacion ya existe" })
                }

                throw error
            }
        },

        async list(req, res) {
            const search = String(req.query.search ?? "").trim()

            if (!search) {
                return res.json([])
            }

            const like = `%${search}%`
            const [rows] = await database.query(
                `SELECT id, cedula, nombre, direccion, telefono, email
                 FROM clientes
                 WHERE cedula LIKE ? OR nombre LIKE ?
                 ORDER BY nombre ASC
                 LIMIT 50`,
                [like, like]
            )

            return res.json(rows)
        },

        async update(req, res) {
            const clientId = Number(req.params.id)
            const requestedFields = Object.keys(req.body ?? {})
            const unknownFields = requestedFields.filter((field) =>
                !editableFields.includes(field) && field !== "cedula"
            )

            if (!Number.isInteger(clientId) || clientId < 1) {
                return res.status(400).json({ error: "Identificador de cliente invalido" })
            }

            if (unknownFields.length > 0) {
                return res.status(400).json({ error: "Datos de cliente no permitidos" })
            }

            const [clients] = await database.query(
                "SELECT id, cedula FROM clientes WHERE id = ?",
                [clientId]
            )

            if (clients.length === 0) {
                return res.status(404).json({ error: "Cliente no encontrado" })
            }

            if (req.body.cedula !== undefined && String(req.body.cedula) !== clients[0].cedula) {
                const [jobs] = await database.query(
                    "SELECT id FROM trabajos WHERE cliente_id = ? AND estado IN ('PENDIENTE', 'EN_PROCESO', 'FINALIZADO') LIMIT 1",
                    [clientId]
                )

                if (jobs.length > 0) {
                    return res.status(409).json({
                        error: "La identificacion no puede modificarse porque el cliente tiene trabajos"
                    })
                }

                return res.status(400).json({ error: "La identificacion no puede modificarse" })
            }

            const updates = editableFields.filter((field) => req.body[field] !== undefined)

            if (updates.length === 0) {
                return res.status(400).json({ error: "No hay datos para actualizar" })
            }

            const values = updates.map((field) => req.body[field])
            const assignments = updates.map((field) => `${field} = ?`).join(", ")
            values.push(clientId)

            await database.query(
                `UPDATE clientes SET ${assignments} WHERE id = ?`,
                values
            )

            const [updatedClients] = await database.query(
                "SELECT id, cedula, nombre, direccion, telefono, email FROM clientes WHERE id = ?",
                [clientId]
            )

            return res.json(updatedClients[0])
        }
    }
}