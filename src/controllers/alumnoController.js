const repo = require('../repositories/alumnoRepository')
const { ok, fail } = require('../utils/http')

async function altaCompleta(req, res) {
  try {
    const { alumnoUsuario = {}, alumno = {}, tutor = {} } = req.body || {}
    if (!alumnoUsuario.nombre || !alumnoUsuario.email) {
      return fail(res, 'Faltan datos del alumno (nombre, email)', 400)
    }
    const alumnoPayload = {
      nombre: alumnoUsuario.nombre,
      Ap: alumnoUsuario.Ap ?? '',
      Am: alumnoUsuario.Am ?? '',
      calle: alumnoUsuario.calle ?? '',
      colonia: alumnoUsuario.colonia ?? '',
      numero: alumnoUsuario.numero ?? '',
      cp: alumnoUsuario.cp ?? 0,
      telefono: alumnoUsuario.telefono ?? 0,
      email: alumnoUsuario.email,
      idNivel: 4,
      password: alumnoUsuario.password || 'alumno123',
      tipo_usuario: 'alumno',
    }
    const idUsuarioAlumno = await repo.createAlumnoUsuario(alumnoPayload)
    const idAlumno = await repo.createAlumno(idUsuarioAlumno, { idGrupo: alumno.idGrupo || 1, turno: alumno.turno })

    let idUsuarioTutor = null
    const tutorMode = tutor.mode || (tutor.usuario ? 'nuevo' : (tutor.email ? 'existente' : null))
    if (tutorMode === 'existente') {
      idUsuarioTutor = await repo.findTutorUsuarioByEmail(tutor.email)
      if (!idUsuarioTutor) return fail(res, 'Tutor no encontrado por email', 404)
    } else if (tutorMode === 'nuevo') {
      const tu = tutor.usuario || {}
      if (!tu.nombre || !tu.email) return fail(res, 'Faltan datos del tutor (nombre, email)', 400)
      const tutorPayload = {
        nombre: tu.nombre,
        Ap: tu.Ap ?? '',
        Am: tu.Am ?? '',
        calle: tu.calle ?? '',
        colonia: tu.colonia ?? '',
        numero: tu.numero ?? '',
        cp: tu.cp ?? 0,
        telefono: tu.telefono ?? 0,
        email: tu.email,
        idNivel: 3,
        password: tu.password || 'tutor123',
        tipo_usuario: 'tutor',
      }
      idUsuarioTutor = await repo.createTutorUsuario(tutorPayload)
    }
    if (idUsuarioTutor) await repo.vincularTutorAlumno(idUsuarioTutor, idAlumno)

    return ok(res, { idAlumno, idUsuarioAlumno, idUsuarioTutor }, 201)
  } catch (e) {
    return fail(res, e.message, 500)
  }
}

module.exports = { altaCompleta }
