const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

// GET - Obtener todos los avisos
router.get('/', (req, res) => {
  db.query('SELECT * FROM Avisos ORDER BY fecha DESC, hora DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET - Avisos por grupo
router.get('/grupo/:idGrupo', (req, res) => {
  const { idGrupo } = req.params;
  db.query('SELECT * FROM Avisos WHERE idGrupo = ? ORDER BY fecha DESC, hora DESC', [idGrupo], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET - Avisos por alumno (deduciendo grupo actual)
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  const sql = `
    SELECT av.*
    FROM Avisos av
    JOIN Grupo g ON av.idGrupo = g.idGrupo
    JOIN Alumnos a ON a.idGrupo = g.idGrupo OR a.idGrupos = g.idGrupo
    WHERE a.idAlumnos = ? OR a.idAlumno = ?
    ORDER BY av.fecha DESC, av.hora DESC
  `;
  db.query(sql, [idAlumno, idAlumno], (err, results) => {
    if (err) return res.status(200).json([]);
    res.json(results);
  });
});

// POST - Crear aviso
router.post('/', (req, res) => {
  const { mensaje, fecha, hora, idGrupo } = req.body;
  if (!mensaje || !fecha || !hora || !idGrupo) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  
  db.query('INSERT INTO Avisos (mensaje, fecha, hora, idGrupo) VALUES (?,?,?,?)', 
    [mensaje, fecha, hora, idGrupo], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ idAvisos: results.insertId, message: 'Aviso creado exitosamente' });
  });
});

module.exports = router;
