const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

router.get('/', (req, res) => {
  db.query('SELECT * FROM Talleres', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Talleres por alumno (ruta alternativa)
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  const sql = `
    SELECT t.*
    FROM Talleres t
    JOIN TalleresAlumnos ta ON ta.idTaller = t.idTaller
    WHERE ta.idAlumnos = ? OR ta.idAlumno = ?
  `;
  db.query(sql, [idAlumno, idAlumno], (err, results) => {
    if (err) return res.status(200).json([]);
    res.json(results);
  });
});

module.exports = router;
