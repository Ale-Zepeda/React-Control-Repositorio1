const { pool } = require('../config/db')

async function describeTable(table) {
  const [rows] = await pool.query(`DESCRIBE ${table}`)
  return rows.map(r => r.Field)
}

async function findAll({ role } = {}) {
  if (role === 'profesor') {
    const sql = `
      SELECT u.*, GROUP_CONCAT(CONCAT(p.materia,' (',p.semestre,'-',p.turno,')') SEPARATOR ', ') AS materias
      FROM usuarios u
      LEFT JOIN Profesores p ON p.idUsuarioProfesor = u.idUsuario
      WHERE u.tipo_usuario = ?
      GROUP BY u.idUsuario
    `
    const [rows] = await pool.query(sql, [role])
    return rows
  }
  if (role) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE tipo_usuario = ?', [role])
    return rows
  }
  const [rows] = await pool.query('SELECT * FROM usuarios')
  return rows
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE idUsuario = ?', [id])
  return rows[0] || null
}

async function create(userPayload) {
  const [res] = await pool.query('INSERT INTO usuarios SET ?', [userPayload])
  return res.insertId
}

async function update(id, payload) {
  const [res] = await pool.query('UPDATE usuarios SET ? WHERE idUsuario = ?', [payload, id])
  return res.affectedRows > 0
}

async function remove(id) {
  const [res] = await pool.query('DELETE FROM usuarios WHERE idUsuario = ?', [id])
  return res.affectedRows > 0
}

async function toggleActive(id, value) {
  const cols = await describeTable('usuarios')
  const idCols = ['idUsuario','id','idUsuarios'].filter(c => cols.includes(c))
  const statusCol = ['activo','estado','estatus','enabled','isActive','status'].find(c => cols.includes(c))
  if (!statusCol || idCols.length === 0) {
    const err = new Error('No se encontraron columnas esperadas en Usuarios')
    err.details = cols
    err.suggestion = 'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;'
    throw err
  }
  const where = idCols.map(c => `${c} = ?`).join(' OR ')
  const sql = `UPDATE usuarios SET ${statusCol} = ? WHERE ${where}`
  const params = [value, ...idCols.map(()=>id)]
  const [res] = await pool.query(sql, params)
  return res.affectedRows > 0
}

async function ensureProfesoresTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS Profesores (
    idProfesor INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    idUsuarioProfesor INT NOT NULL,
    materia VARCHAR(100) NOT NULL,
    semestre VARCHAR(20) NOT NULL,
    turno ENUM('matutino','vespertino') NOT NULL,
    INDEX (idUsuarioProfesor)
  ) ENGINE=InnoDB`)
}

async function addProfesorDetails(idUsuarioProfesor, { materia, semestre, turno }) {
  await ensureProfesoresTable()
  const materias = String(materia).split(',').map(m=>m.trim()).filter(Boolean)
  for (const m of materias) {
    await pool.query('INSERT INTO Profesores (idUsuarioProfesor, materia, semestre, turno) VALUES (?,?,?,?)', [idUsuarioProfesor, m, semestre || '', turno || 'matutino'])
  }
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  toggleActive,
  addProfesorDetails,
}
