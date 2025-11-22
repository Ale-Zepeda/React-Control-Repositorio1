const svc = require('../services/userService')
const { ok, fail } = require('../utils/http')

async function list(req, res) {
  try { return ok(res, await svc.listUsers(req.query)) } catch (e) { return fail(res, e.message, e.status || 500) }
}
async function get(req, res) {
  try {
    const u = await svc.getUser(req.params.id)
    if (!u) return fail(res, 'No encontrado', 404)
    return ok(res, u)
  } catch (e) { return fail(res, e.message, e.status || 500) }
}
async function create(req, res) {
  try { return ok(res, await svc.createUser(req.body), 201) } catch (e) { return fail(res, e.message, e.status || 500) }
}
async function update(req, res) {
  try {
    const okUpd = await svc.updateUser(req.params.id, req.body)
    if (!okUpd) return fail(res, 'No encontrado', 404)
    return ok(res, { message: 'Actualizado' })
  } catch (e) { return fail(res, e.message, e.status || 500) }
}
async function remove(req, res) {
  try {
    const okDel = await svc.deleteUser(req.params.id)
    if (!okDel) return fail(res, 'No encontrado', 404)
    return ok(res, { message: 'Eliminado' })
  } catch (e) { return fail(res, e.message, e.status || 500) }
}
async function toggleActive(req, res) {
  try {
    const okAct = await svc.setActive(req.params.id, (req.body?.activo ?? 1) ? 1 : 0)
    if (!okAct) return fail(res, 'No encontrado', 404)
    return ok(res, { message: 'Estado actualizado' })
  } catch (e) { return fail(res, e.message, e.status || 500) }
}

module.exports = { list, get, create, update, remove, toggleActive }
