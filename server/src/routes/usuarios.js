const express = require('express')
const mysql = require('mysql2')
const router = express.Router()

// DB
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar',
})

// GET - Usuarios (opcional ?rol=admin|profesor|tutor|alumno)
router.get('/', (req, res) => {
  const { rol } = req.query
  if (rol) {
    // Profesores: incluir materias si existe tabla
    if (rol === 'profesor') {
      const sql = `
        SELECT u.*, GROUP_CONCAT(p.materia SEPARATOR ', ') AS materias
        FROM usuarios u
        LEFT JOIN Profesores p ON p.idUsuarioProfesor = u.idUsuario
        WHERE u.tipo_usuario = ?
        GROUP BY u.idUsuario
      `
      return db.query(sql, [rol], (err, results) => {
        if (err) return res.status(500).json({ error: err.message })
        return res.json(results)
      })
    }
    return db.query('SELECT * FROM usuarios WHERE tipo_usuario = ?', [rol], (err, results) => {
      if (err) return res.status(500).json({ error: err.message })
      return res.json(results)
    })
  }
  db.query('SELECT * FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// GET - Usuario por id
router.get('/:id', (req, res) => {
  const { id } = req.params
  db.query('SELECT * FROM usuarios WHERE idUsuario = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(results[0])
  })
})

// POST - Crear usuario (con vínculos básicos alumno/tutor y materias de profesor)
router.post('/', async (req, res) => {
  const { nombre, email, password } = req.body || {}
  const role = req.body.rol || req.body.tipo_usuario
  if (!nombre || !email || !password || !role) {
    return res.status(400).json({ error: 'nombre, email, password y rol/tipo_usuario son requeridos' })
  }
  const payload = {
    nombre,
    Ap: req.body.Ap ?? '',
    Am: req.body.Am ?? '',
    calle: req.body.calle ?? '',
    colonia: req.body.colonia ?? '',
    numero: req.body.numero ?? '',
    cp: req.body.cp ?? 0,
    telefono: req.body.telefono ?? 0,
    email,
    idNivel: ({ admin:1, profesor:2, tutor:3, alumno:4 }[role] || 4),
    password,
    tipo_usuario: role,
  }
  db.query('INSERT INTO usuarios SET ?', payload, async (err, result) => {
    if (err) return res.status(500).json({ error: err.message })
    const newUserId = result.insertId

    try {
      // Alumno: crear registro alumnos y tutor si viene en payload
      if (role === 'alumno') {
        await new Promise((resolve, reject) => {
          db.query('INSERT INTO alumnos (idUsuarios, idGrupo) VALUES (?, ?)', [newUserId, 1], (e)=> e?reject(e):resolve())
        })
        const [alumnoRow] = await new Promise((resolve, reject) => {
          db.query('SELECT idAlumnos FROM alumnos WHERE idUsuarios = ? ORDER BY idAlumnos DESC LIMIT 1', [newUserId], (e, rows)=> e?reject(e):resolve(rows))
        })
        const idAlumno = alumnoRow?.idAlumnos
        if (req.body.tutorNombre) {
          const tutorPayload = {
            nombre: req.body.tutorNombre,
            Ap: '', Am: '', calle: '', colonia: '', numero: '', cp: 0, telefono: 0,
            email: req.body.tutorEmail || `tutor_${Date.now()}@example.com`,
            idNivel: 3,
            password: req.body.tutorPassword || 'tutor123',
            tipo_usuario: 'tutor'
          }
          const tutorIdUsuario = await new Promise((resolve, reject) => {
            db.query('INSERT INTO usuarios SET ?', tutorPayload, (e,r)=> e?reject(e):resolve(r.insertId))
          })
          await new Promise((resolve, reject) => {
            db.query('INSERT INTO tutor (idUsuario, idAlumno) VALUES (?, ?)', [tutorIdUsuario, idAlumno], (e)=> e?reject(e):resolve())
          })
        }
      }

      // Tutor: vincular a alumno si se envía
      if (role === 'tutor') {
        let alumnoId = req.body.alumnoId
        if (!alumnoId && req.body.alumnoNombre) {
          const aPayload = {
            nombre: req.body.alumnoNombre,
            Ap: '', Am: '', calle: '', colonia: '', numero: '', cp: 0, telefono: 0,
            email: req.body.alumnoEmail || `alumno_${Date.now()}@example.com`,
            idNivel: 4,
            password: req.body.alumnoPassword || 'alumno123',
            tipo_usuario: 'alumno'
          }
          const alumnoUsuarioId = await new Promise((resolve, reject) => {
            db.query('INSERT INTO usuarios SET ?', aPayload, (e,r)=> e?reject(e):resolve(r.insertId))
          })
          await new Promise((resolve, reject) => {
            db.query('INSERT INTO alumnos (idUsuarios, idGrupo) VALUES (?, ?)', [alumnoUsuarioId, 1], (e)=> e?reject(e):resolve())
          })
          const [rowA] = await new Promise((resolve, reject) => {
            db.query('SELECT idAlumnos FROM alumnos WHERE idUsuarios = ? ORDER BY idAlumnos DESC LIMIT 1', [alumnoUsuarioId], (e, rows)=> e?reject(e):resolve(rows))
          })
          alumnoId = rowA?.idAlumnos
        }
        if (alumnoId) {
          await new Promise((resolve, reject) => {
            db.query('INSERT INTO tutor (idUsuario, idAlumno) VALUES (?, ?)', [newUserId, alumnoId], (e)=> e?reject(e):resolve())
          })
        }
      }

      // Profesor: materias (en tabla Profesores si existe/crear)
      if (role === 'profesor' && (req.body.materia || req.body.semestre || req.body.turno)) {
        try {
          await new Promise((resolve, reject) => {
            db.query(`CREATE TABLE IF NOT EXISTS Profesores (
              idProfesor INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
              idUsuarioProfesor INT NOT NULL,
              materia VARCHAR(100) NOT NULL,
              semestre VARCHAR(20) NOT NULL,
              turno ENUM('matutino','vespertino') NOT NULL,
              INDEX (idUsuarioProfesor)
            ) ENGINE=InnoDB`, (e)=> e?reject(e):resolve())
          })
          const materias = String(req.body.materia || '').split(',').map(m=>m.trim()).filter(Boolean)
          for (const m of materias) {
            await new Promise((resolve, reject) => {
              db.query('INSERT INTO Profesores (idUsuarioProfesor, materia, semestre, turno) VALUES (?,?,?,?)', [newUserId, m, req.body.semestre || '', req.body.turno || 'matutino'], (e)=> e?reject(e):resolve())
            })
          }
        } catch (e) { /* ignore mapping errors */ }
      }

      return res.status(201).json({ idUsuario: newUserId, message: 'Usuario creado exitosamente' })
    } catch (ex) {
      return res.status(500).json({ error: ex.message })
    }
  })
})

// PUT - Actualizar usuario
router.put('/:id', (req, res) => {
  const { id } = req.params
  const payload = {}
  const role = req.body.rol ?? req.body.tipo_usuario
  ;['nombre','Ap','Am','calle','colonia','numero','cp','telefono','email','password'].forEach(k=>{
    if (req.body[k] !== undefined) payload[k] = req.body[k]
  })
  if (role !== undefined) payload.tipo_usuario = role
  if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'Nada que actualizar' })
  db.query('UPDATE usuarios SET ? WHERE idUsuario = ?', [payload, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ message: 'Usuario actualizado exitosamente' })
  })
})

// PUT - Activar/Desactivar usuario
router.put('/:id/activo', (req, res) => {
  const { id } = req.params
  const val = (req.body?.activo ?? 1) ? 1 : 0
  db.query('DESCRIBE usuarios', (err, columns) => {
    if (err) return res.status(500).json({ error: err.message })
    const colNames = columns.map(c=>c.Field)
    const statusCol = ['activo','estado','estatus','enabled','isActive','status'].find(c=> colNames.includes(c))
    const idCols = ['idUsuario','id','idUsuarios'].filter(c=> colNames.includes(c))
    if (!statusCol || idCols.length===0) return res.status(400).json({ error:'No se encontraron columnas esperadas en Usuarios', disponibles: colNames })
    const where = idCols.map(c=>`${c} = ?`).join(' OR ')
    const sql = `UPDATE usuarios SET ${statusCol} = ? WHERE ${where}`
    const params = [val, ...idCols.map(()=>id)]
    db.query(sql, params, (e, r)=>{
      if (e) return res.status(500).json({ error: e.message })
      if (r.affectedRows === 0) return res.status(404).json({ error:'Usuario no encontrado' })
      return res.json({ message:'Estado actualizado' })
    })
  })
})

// DELETE - Eliminar usuario
router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.query('DELETE FROM usuarios WHERE idUsuario = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ message: 'Usuario eliminado exitosamente' })
  })
})

module.exports = router
