import assert from 'node:assert/strict'
import test from 'node:test'
import pool from '../src/config/db.js'
import {
  createClientUser,
  findUserByEmail,
  createUser,
  listarUsuarios,
  findUserById,
  findUserAuthStatus,
  cambiarEstadoUsuarioTransaccional,
  editarUsuarioTransaccional,
} from '../src/models/userModel.js'

function setPoolExecuteResponder(responder) {
  pool.execute = async (...args) => responder(...args)
}

function setPoolQueryResponder(responder) {
  pool.query = async (...args) => responder(...args)
}

function buildConnection({ userRows = [], adminRows = [], updateResult = [{ affectedRows: 1 }], finalUserRows = [] }) {
  const calls = []
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql, params = []) => {
      calls.push({ sql, params })
      if (sql.includes('INSERT INTO usuarios')) {
        return [{ insertId: 42 }]
      }
      if (sql.includes('INSERT INTO clientes')) {
        return [{ insertId: 99 }]
      }
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN' AND activo = 1 ORDER BY id FOR UPDATE")) {
        return [adminRows]
      }
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        return [userRows]
      }
      if (sql.includes('UPDATE usuarios SET activo = ? WHERE id = ?')) {
        return updateResult
      }
      if (sql.includes('UPDATE usuarios SET')) {
        return updateResult
      }
      if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
        return [finalUserRows]
      }
      if (sql.includes('SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?')) {
        return [[{ id: 7, nombre: 'Ana', email: 'ana@example.com', password: 'hash', rol: 'CLIENTE', activo: 1 }]]
      }
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ?')) {
        return [userRows]
      }
      return [[]]
    },
  }
  return { connection, calls }
}

test('createClientUser crea usuario y cliente con transacción correcta', async () => {
  const { connection } = buildConnection({ userRows: [{ id: 42, rol: 'CLIENTE', activo: 1 }], adminRows: [{ id: 1 }, { id: 2 }], finalUserRows: [{ id: 42, nombre: 'Ana', email: 'ana@example.com', rol: 'CLIENTE', activo: 1, creadoEn: '2024-01-01' }] })
  pool.getConnection = async () => connection

  const result = await createClientUser({ nombre: 'Ana', email: 'ana@example.com', password: 'hash' })

  assert.deepEqual(result, { id: 42, clienteId: 99 })
})

test('createClientUser hace rollback al fallar la inserción', async () => {
  let rollbackCalled = false
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {
      rollbackCalled = true
    },
    release: () => {},
    execute: async () => {
      throw new Error('db error')
    },
  }
  pool.getConnection = async () => connection

  await assert.rejects(() => createClientUser({ nombre: 'Ana', email: 'bad', password: 'hash' }), /db error/)
  assert.equal(rollbackCalled, true)
})

test('findUserByEmail, createUser, listarUsuarios, findUserById y findUserAuthStatus resuelven datos esperados', async () => {
  setPoolExecuteResponder((sql) => {
    if (sql.includes('WHERE email = ?')) {
      return [[{ id: 1, nombre: 'Ana', email: 'ana@example.com', password: 'hash', rol: 'ADMIN', activo: 1 }]]
    }
    if (sql.includes('INSERT INTO usuarios')) {
      return [{ insertId: 77 }]
    }
    if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
      return [[{ id: 2, nombre: 'Luis', email: 'luis@example.com', rol: 'TECNICO', activo: 1, creadoEn: '2024-01-01' }]]
    }
    if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ?')) {
      return [[{ id: 2, rol: 'TECNICO', activo: 1 }]]
    }
    return [[]]
  })

  setPoolQueryResponder((sql) => {
    if (sql.includes('FROM usuarios')) {
      return [[{ id: 1, nombre: 'Ana', email: 'ana@example.com', rol: 'ADMIN', activo: 1, creadoEn: '2024-01-01' }]]
    }
    return [[]]
  })

  const userByEmail = await findUserByEmail('ana@example.com')
  const insertedId = await createUser({ nombre: 'Luis', email: 'luis@example.com', password: 'hash', rol: 'TECNICO' })
  const list = await listarUsuarios({ rol: 'ADMIN', activo: '1' })
  const byId = await findUserById(2)
  const authStatus = await findUserAuthStatus(2)

  assert.deepEqual(userByEmail.email, 'ana@example.com')
  assert.equal(insertedId, 77)
  assert.equal(list.length, 1)
  assert.equal(byId.nombre, 'Luis')
  assert.equal(authStatus.rol, 'TECNICO')
})

test('cambiarEstadoUsuarioTransaccional maneja casos de éxito, último admin, y retry por deadlock', async () => {
  const createConn = (userRow = { id: 5, rol: 'TECNICO', activo: 0 }, adminRows = [{ id: 1 }, { id: 2 }]) => {
    const connection = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      execute: async (sql, params = []) => {
        if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN' AND activo = 1 ORDER BY id FOR UPDATE")) {
          return [adminRows]
        }
        if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
          return [userRow ? [userRow] : []]
        }
        if (sql.includes('UPDATE usuarios SET activo = ? WHERE id = ?')) {
          userRow = { ...userRow, activo: params[0] }
          return [{ affectedRows: 1 }]
        }
        if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
          return [[{ id: 5, nombre: 'Ana', email: 'ana@example.com', rol: 'TECNICO', activo: params[0], creadoEn: '2024-01-01' }]]
        }
        return [[]]
      },
    }
    return connection
  }

  pool.getConnection = async () => createConn()
  const ok = await cambiarEstadoUsuarioTransaccional(5, 1)
  assert.equal(ok.exito, true)

  pool.getConnection = async () => createConn({ id: 1, rol: 'ADMIN', activo: 1 }, [{ id: 1 }])
  const lastAdmin = await cambiarEstadoUsuarioTransaccional(1, 0)
  assert.equal(lastAdmin.codigo, 409)

  let callNumber = 0
  pool.getConnection = async () => {
    const connection = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      execute: async (sql) => {
        if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
          callNumber += 1
          if (callNumber === 1) {
            const err = new Error('deadlock')
            err.code = 'ER_LOCK_DEADLOCK'
            throw err
          }
          return [[{ id: 9, rol: 'CLIENTE', activo: 0 }]]
        }
        if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN' AND activo = 1 ORDER BY id FOR UPDATE")) {
          return [[{ id: 1 }, { id: 2 }]]
        }
        if (sql.includes('UPDATE usuarios SET activo = ? WHERE id = ?')) {
          return [{ affectedRows: 1 }]
        }
        if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
          return [[{ id: 9, nombre: 'Zoe', email: 'zoe@example.com', rol: 'CLIENTE', activo: 1, creadoEn: '2024-01-01' }]]
        }
        return [[]]
      },
    }
    return connection
  }

  const retried = await cambiarEstadoUsuarioTransaccional(9, 1)
  assert.equal(retried.exito, true)
  assert.equal(callNumber, 2)
})

test('editarUsuarioTransaccional modifica usuario y evita degradar al último admin', async () => {
  let updateCalls = 0
  const createConn = ({ userRow, adminRows }) => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN' AND activo = 1 ORDER BY id FOR UPDATE")) {
        return [adminRows]
      }
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        return [userRow ? [userRow] : []]
      }
      if (sql.includes('UPDATE usuarios SET')) {
        updateCalls += 1
        return [{ affectedRows: 1 }]
      }
      if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
        return [[{ id: 3, nombre: 'Nuevo', email: 'nuevo@example.com', rol: 'TECNICO', activo: 1, creadoEn: '2024-01-01' }]]
      }
      return [[]]
    },
  })

  pool.getConnection = async () => createConn({
    userRow: { id: 3, rol: 'CLIENTE', activo: 1 },
    adminRows: [{ id: 1 }, { id: 2 }],
  })
  const edited = await editarUsuarioTransaccional(3, { nombre: 'Nuevo', email: 'nuevo@example.com', rol: 'TECNICO' })
  assert.equal(edited.exito, true)
  assert.equal(updateCalls >= 1, true)

  pool.getConnection = async () => createConn({
    userRow: { id: 1, rol: 'ADMIN', activo: 1 },
    adminRows: [{ id: 1 }],
  })
  const blocked = await editarUsuarioTransaccional(1, { rol: 'TECNICO' })
  assert.equal(blocked.codigo, 409)
})

test('cubre ramas no encontradas y filtros extremos de listarUsuarios', async () => {
  pool.execute = async (sql) => {
    if (sql.includes('SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?')) {
      return [[]]
    }
    if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
      return [[]]
    }
    if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ?')) {
      return [[]]
    }
    return [[]]
  }

  const noMail = await findUserByEmail('inexistente@example.com')
  const noUser = await findUserById(999)
  const noAuth = await findUserAuthStatus(999)
  assert.equal(noMail, undefined)
  assert.equal(noUser, null)
  assert.equal(noAuth, null)

  pool.execute = async (sql) => {
    if (sql.includes('WHERE email = ?')) {
      return [[{ id: 1, nombre: 'Ana', email: 'ana@example.com', password: 'hash', rol: 'ADMIN', activo: 1 }]]
    }
    return [[]]
  }
  const foundMail = await findUserByEmail('ana@example.com')
  assert.equal(foundMail.email, 'ana@example.com')

  pool.query = async (sql, params) => {
    if (sql.includes('ORDER BY nombre ASC')) {
      if (params.length === 0) {
        return [[]]
      }
      if (params[0] === 'CLIENTE' && params[1] === 1) {
        return [[{ id: 1, nombre: 'Ana', email: 'ana@example.com', rol: 'CLIENTE', activo: 1, creadoEn: '2024-01-01' }]]
      }
      return [[]]
    }
    return [[]]
  }

  const emptyFilter = await listarUsuarios({ rol: 'SUPERADMIN', activo: '9' })
  const validFilter = await listarUsuarios({ rol: 'CLIENTE', activo: '1' })
  assert.deepEqual(emptyFilter, [])
  assert.equal(validFilter.length, 1)
})

test('cambiarEstadoUsuarioTransaccional cubre no encontrado, mismo estado y errores no recuperables', async () => {
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }, { id: 2 }]]
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) return [[]]
      return [[]]
    },
  })

  const missing = await cambiarEstadoUsuarioTransaccional(999, 1)
  assert.equal(missing.codigo, 404)

  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }, { id: 2 }]]
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        return [[{ id: 15, rol: 'CLIENTE', activo: 1 }]]
      }
      return [[]]
    },
  })

  const sameStatus = await cambiarEstadoUsuarioTransaccional(15, 1)
  assert.equal(sameStatus.codigo, 409)

  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async () => {
      const err = new Error('sql exploded')
      err.code = 'ER_PARSE_ERROR'
      throw err
    },
  })

  await assert.rejects(() => cambiarEstadoUsuarioTransaccional(1, 0), /sql exploded/)
})

test('cambiarEstadoUsuarioTransaccional agota reintentos con deadlock', async () => {
  let attempts = 0
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async () => {
      attempts += 1
      const err = new Error('deadlock')
      err.code = 'ER_LOCK_DEADLOCK'
      err.errno = 1213
      throw err
    },
  })

  await assert.rejects(() => cambiarEstadoUsuarioTransaccional(20, 0), /deadlock/)
  assert.equal(attempts >= 3, true)
})

test('editarUsuarioTransaccional cubre no encontrado, reintento deadlock y error no recuperable', async () => {
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }, { id: 2 }]]
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) return [[]]
      return [[]]
    },
  })

  const missing = await editarUsuarioTransaccional(404, { nombre: 'X' })
  assert.equal(missing.codigo, 404)

  let retryCalls = 0
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes('FOR UPDATE')) {
        retryCalls += 1
        if (retryCalls === 1) {
          const err = new Error('deadlock edit')
          err.code = 'ER_LOCK_DEADLOCK'
          err.errno = 1213
          throw err
        }
      }
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }, { id: 2 }]]
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        return [[{ id: 7, rol: 'CLIENTE', activo: 1 }]]
      }
      if (sql.includes('UPDATE usuarios SET')) return [{ affectedRows: 1 }]
      if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
        return [[{ id: 7, nombre: 'A', email: 'a@a.com', rol: 'CLIENTE', activo: 1, creadoEn: '2024-01-01' }]]
      }
      return [[]]
    },
  })

  const retried = await editarUsuarioTransaccional(7, { nombre: 'A' })
  assert.equal(retried.exito, true)
  assert.equal(retryCalls >= 2, true)

  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async () => {
      const err = new Error('fatal edit')
      err.code = 'ER_BAD_FIELD_ERROR'
      throw err
    },
  })

  await assert.rejects(() => editarUsuarioTransaccional(1, { rol: 'ADMIN' }), /fatal edit/)
})

test('createClientUser hace rollback cuando falla la creación del cliente', async () => {
  let rollbackCalled = false
  let executeCount = 0
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {
      rollbackCalled = true
    },
    release: () => {},
    execute: async (sql) => {
      executeCount += 1
      if (sql.includes('INSERT INTO usuarios')) {
        return [{ insertId: 60 }]
      }
      if (sql.includes('INSERT INTO clientes')) {
        throw new Error('insert cliente failed')
      }
      return [[]]
    },
  })

  await assert.rejects(() => createClientUser({ nombre: 'T', email: 't@t.com', password: 'x' }), /insert cliente failed/)
  assert.equal(executeCount >= 2, true)
  assert.equal(rollbackCalled, true)
})

test('cambiarEstadoUsuarioTransaccional reintenta con errno 1213 y cubre estado inactivo repetido', async () => {
  let attempts = 0
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        attempts += 1
        if (attempts === 1) {
          const err = new Error('deadlock errno path')
          err.errno = 1213
          throw err
        }
        return [[{ id: 99, rol: 'CLIENTE', activo: 0 }]]
      }
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }, { id: 2 }]]
      if (sql.includes('UPDATE usuarios SET activo = ? WHERE id = ?')) return [{ affectedRows: 1 }]
      if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
        return [[{ id: 99, nombre: 'Cli', email: 'cli@mail.com', rol: 'CLIENTE', activo: 1, creadoEn: '2024-01-01' }]]
      }
      return [[]]
    },
  })

  const retried = await cambiarEstadoUsuarioTransaccional(99, 1)
  assert.equal(retried.exito, true)
  assert.equal(attempts, 2)

  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }, { id: 2 }]]
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        return [[{ id: 88, rol: 'TECNICO', activo: 0 }]]
      }
      return [[]]
    },
  })

  const alreadyInactive = await cambiarEstadoUsuarioTransaccional(88, 0)
  assert.equal(alreadyInactive.codigo, 409)
  assert.equal(alreadyInactive.mensaje.includes('inactivo'), true)
})

test('editarUsuarioTransaccional permite mantener rol ADMIN y reintenta con errno 1213', async () => {
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }]]
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        return [[{ id: 1, rol: 'ADMIN', activo: 1 }]]
      }
      if (sql.includes('UPDATE usuarios SET')) return [{ affectedRows: 1 }]
      if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
        return [[{ id: 1, nombre: 'Admin', email: 'admin@mail.com', rol: 'ADMIN', activo: 1, creadoEn: '2024-01-01' }]]
      }
      return [[]]
    },
  })
  const adminKept = await editarUsuarioTransaccional(1, { rol: 'ADMIN', nombre: 'Admin' })
  assert.equal(adminKept.exito, true)

  let retry = 0
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes('FOR UPDATE')) {
        retry += 1
        if (retry === 1) {
          const err = new Error('deadlock edit errno')
          err.errno = 1213
          throw err
        }
      }
      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'ADMIN'")) return [[{ id: 1 }, { id: 2 }]]
      if (sql.includes('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE')) {
        return [[{ id: 10, rol: 'CLIENTE', activo: 1 }]]
      }
      if (sql.includes('UPDATE usuarios SET')) return [{ affectedRows: 1 }]
      if (sql.includes('SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?')) {
        return [[{ id: 10, nombre: 'X', email: 'x@x.com', rol: 'CLIENTE', activo: 1, creadoEn: '2024-01-01' }]]
      }
      return [[]]
    },
  })

  const retried = await editarUsuarioTransaccional(10, { nombre: 'X' })
  assert.equal(retried.exito, true)
  assert.equal(retry >= 2, true)
})
