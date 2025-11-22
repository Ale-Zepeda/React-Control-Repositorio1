const userRepo = require('../repositories/userRepository')

async function listUsers(query) {
  const role = query.rol || query.role || null
  return userRepo.findAll({ role })
}
async function getUser(id) {
  return userRepo.findById(id)
}
async function createUser(body) {
  const role = body.rol || body.tipo_usuario
  if (!body.nombre || !body.email || !body.password || !role) {
    const err = new Error('nombre, email, password y rol/tipo_usuario son requeridos')
    err.status = 400
    throw err
  }
  const payload = {
    nombre: body.nombre,
    Ap: body.Ap ?? '',
    Am: body.Am ?? '',
    calle: body.calle ?? '',
    colonia: body.colonia ?? '',
    numero: body.numero ?? '',
    cp: body.cp ?? 0,
    telefono: body.telefono ?? 0,
    email: body.email,
    idNivel: ({ admin:1, profesor:2, tutor:3, alumno:4 }[role] || 4),
    password: body.password,
    tipo_usuario: role,
  }
  const id = await userRepo.create(payload)
  if (role === 'profesor' && (body.materia || body.semestre || body.turno)) {
    await userRepo.addProfesorDetails(id, {
      materia: body.materia || '',
      semestre: body.semestre || '',
      turno: body.turno || 'matutino',
    })
  }
  return { idUsuario: id }
}
async function updateUser(id, body) {
  const role = body.rol ?? body.tipo_usuario
  const payload = {}
  ;['nombre','Ap','Am','calle','colonia','numero','cp','telefono','email','password'].forEach(k=>{
    if (body[k] !== undefined) payload[k] = body[k]
  })
  if (role !== undefined) payload.tipo_usuario = role
  const ok = await userRepo.update(id, payload)
  return ok
}
async function deleteUser(id) { return userRepo.remove(id) }
async function setActive(id, value) { return userRepo.toggleActive(id, value) }

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  setActive,
}
