const { pool } = require('../config/db')

async function createAlumnoUsuario(usuario) {
  const [res] = await pool.query('INSERT INTO usuarios SET ?', [usuario])
  return res.insertId
}
async function createAlumno(idUsuario, { idGrupo = 1, turno } = {}) {
  // ensure turno column if provided
  if (turno) {
    try { await pool.query("ALTER TABLE alumnos ADD COLUMN turno ENUM('matutino','vespertino') NOT NULL DEFAULT 'matutino'") } catch {}
  }
  const [res] = await pool.query('INSERT INTO alumnos (idUsuarios, idGrupo' + (turno? ', turno' : '') + ') VALUES (?, ?' + (turno? ', ?' : '') + ')', turno ? [idUsuario, idGrupo, turno] : [idUsuario, idGrupo])
  return res.insertId
}
async function findTutorUsuarioByEmail(email) {
  const [rows] = await pool.query('SELECT idUsuario FROM usuarios WHERE email = ? AND tipo_usuario = "tutor" LIMIT 1', [email])
  return rows[0]?.idUsuario || null
}
async function createTutorUsuario(usuario) {
  const [res] = await pool.query('INSERT INTO usuarios SET ?', [usuario])
  return res.insertId
}
async function vincularTutorAlumno(idUsuarioTutor, idAlumno) {
  await pool.query('INSERT INTO tutor (idUsuario, idAlumno) VALUES (?, ?)', [idUsuarioTutor, idAlumno])
}

module.exports = {
  createAlumnoUsuario,
  createAlumno,
  findTutorUsuarioByEmail,
  createTutorUsuario,
  vincularTutorAlumno,
}
