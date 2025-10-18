const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

// GET - Estadísticas por día (compatibilidad con /api/asistencias/dia/:fecha)
router.get('/dia/:fecha', (req, res) => {
  const { fecha } = req.params;
  const sql = `
    SELECT aq.*, a.idAlumnos, a.idUsuarios
    FROM asistenciaqr aq
    JOIN alumnos a ON aq.idAlumnos = a.idAlumnos
    WHERE DATE(aq.fechaHora) = ?
    ORDER BY aq.fechaHora DESC
  `;
  db.query(sql, [fecha], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const stats = {
      fecha,
      total: results.length,
      entradas: results.filter(r => r.tipoMovimiento === 'entrada').length,
      salidas: results.filter(r => r.tipoMovimiento === 'salida').length,
      registros: results
    };
    res.json(stats);
  });
});

// GET - Asistencias por alumno (compatibilidad)
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  db.query('SELECT * FROM asistenciaqr WHERE idAlumnos = ? ORDER BY fechaHora DESC', [idAlumno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
