const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

// GET - Obtener todos los alumnos (enriquecido con datos de usuario y grupo)
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      a.idAlumnos AS idAlumno,
      u.nombre AS nombre,
      u.Ap AS Ap,
      u.Am AS Am,
      CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) AS apellido,
      '' AS matricula,
      a.idGrupo AS grupo,
      u.calle, u.colonia, u.numero, u.cp,
      u.telefono AS telefono,
      u.email AS email
    FROM alumnos a
    JOIN usuarios u ON u.idUsuario = a.idUsuarios
    LEFT JOIN grupo g ON g.idGrupo = a.idGrupo
    ORDER BY a.idAlumnos
  `;
  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST - Alta completa alumno+tutor (transaccional)
router.post('/alta-completa', async (req, res) => {
  const { alumnoUsuario = {}, alumno = {}, tutor = {} } = req.body || {}
  if (!alumnoUsuario.nombre || !alumnoUsuario.email) return res.status(400).json({ error: 'Faltan datos del alumno (nombre, email)' })

  const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'controlescolar'
  })
  const q = (sql, params=[]) => new Promise((resolve,reject)=> conn.query(sql, params, (err, rows)=> err?reject(err):resolve(rows)))
  try {
    await new Promise((resolve,reject)=> conn.beginTransaction(e=> e?reject(e):resolve()))

    const alumnoPayload = {
      nombre: alumnoUsuario.nombre,
      Ap: alumnoUsuario.Ap ?? '',
      Am: alumnoUsuario.Am ?? '',
      calle: alumnoUsuario.calle ?? '', colonia: alumnoUsuario.colonia ?? '', numero: alumnoUsuario.numero ?? '',
      cp: alumnoUsuario.cp ?? 0, telefono: alumnoUsuario.telefono ?? 0,
      email: alumnoUsuario.email, idNivel: 4, password: alumnoUsuario.password || 'alumno123', tipo_usuario: 'alumno'
    }
    const insU = await q('INSERT INTO usuarios SET ?', alumnoPayload)
    const idUsuarioAlumno = insU.insertId

    const idGrupo = alumno.idGrupo || 1
    if (alumno.turno) { try { await q("ALTER TABLE alumnos ADD COLUMN turno ENUM('matutino','vespertino') NOT NULL DEFAULT 'matutino'") } catch {}
    }
    if (alumno.turno) await q('INSERT INTO alumnos (idUsuarios, idGrupo, turno) VALUES (?,?,?)', [idUsuarioAlumno, idGrupo, alumno.turno])
    else await q('INSERT INTO alumnos (idUsuarios, idGrupo) VALUES (?,?)', [idUsuarioAlumno, idGrupo])

    const rowsA = await q('SELECT idAlumnos FROM alumnos WHERE idUsuarios = ? ORDER BY idAlumnos DESC LIMIT 1', [idUsuarioAlumno])
    const idAlumno = rowsA?.[0]?.idAlumnos

    let idUsuarioTutor = null
    const tutorMode = tutor.mode || (tutor.usuario ? 'nuevo' : (tutor.email ? 'existente' : null))
    if (tutorMode === 'existente') {
      const rowsT = await q('SELECT idUsuario FROM usuarios WHERE email = ? AND tipo_usuario = "tutor" LIMIT 1', [tutor.email])
      if (!rowsT.length) throw new Error('Tutor no encontrado por email')
      idUsuarioTutor = rowsT[0].idUsuario
    } else if (tutorMode === 'nuevo') {
      const tu = tutor.usuario || {}
      if (!tu.nombre || !tu.email) throw new Error('Faltan datos del tutor (nombre, email)')
      const tutorPayload = { nombre: tu.nombre, Ap: tu.Ap ?? '', Am: tu.Am ?? '', calle: tu.calle ?? '', colonia: tu.colonia ?? '', numero: tu.numero ?? '', cp: tu.cp ?? 0, telefono: tu.telefono ?? 0, email: tu.email, idNivel: 3, password: tu.password || 'tutor123', tipo_usuario: 'tutor' }
      const insT = await q('INSERT INTO usuarios SET ?', tutorPayload)
      idUsuarioTutor = insT.insertId
    }
    if (idUsuarioTutor) await q('INSERT INTO tutor (idUsuario, idAlumno) VALUES (?, ?)', [idUsuarioTutor, idAlumno])

    await new Promise((resolve,reject)=> conn.commit(e=> e?reject(e):resolve()))
    conn.end()
    return res.status(201).json({ idAlumno, idUsuarioAlumno, idUsuarioTutor })
  } catch (e) {
    try { await new Promise((resolve)=> conn.rollback(()=> resolve())) } catch {}
    conn.end()
    return res.status(500).json({ error: e.message })
  }
})

// GET - Obtener alumno por idUsuario (definido antes para evitar colisión con /:id)
router.get('/usuario/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;
  const sql = `
    SELECT a.*
    FROM Alumnos a
    WHERE a.idUsuarios = ? OR a.idUsuario = ?
    LIMIT 1
  `;
  db.query(sql, [idUsuario, idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Alumno no encontrado para ese usuario' });
    res.json(results[0]);
  });
});

// GET - Obtener alumno por ID (por idAlumnos)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM Alumnos WHERE idAlumnos = ? OR idAlumno = ?', [id, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json(results[0]);
  });
});

// GET - Calificaciones del alumno
router.get('/:id/calificaciones', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM Calificaciones WHERE idAlumnos = ? OR idAlumno = ? ORDER BY fecha DESC`;
  db.query(sql, [id, id], (err, results) => {
    if (err) return res.status(200).json([]); // tolerar estructura distinta
    res.json(results);
  });
});

// GET - Asistencias del alumno
router.get('/:id/asistencias', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM AsistenciaQR WHERE idAlumno = ? ORDER BY fechaHora DESC`;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(200).json([]);
    res.json(results);
  });
});

// GET - Talleres del alumno
router.get('/:id/talleres', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT t.*
    FROM Talleres t
    JOIN TalleresAlumnos ta ON ta.idTaller = t.idTaller
    WHERE ta.idAlumnos = ? OR ta.idAlumno = ?
  `;
  db.query(sql, [id, id], (err, results) => {
    if (err) return res.status(200).json([]);
    res.json(results);
  });
});

// POST - Crear nuevo alumno
router.post('/', (req, res) => {
  const alumnoData = req.body;
  db.query('INSERT INTO Alumnos SET ?', alumnoData, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: results.insertId, message: 'Alumno creado exitosamente' });
  });
});

module.exports = router;
