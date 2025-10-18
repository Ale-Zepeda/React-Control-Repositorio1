const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

// GET - Todos los tutores (enriquecido con datos de usuario)
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      t.idTutor,
      u.nombre AS nombre,
      CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) AS apellido,
      u.telefono AS telefono,
      u.email AS email,
      t.idAlumno
    FROM tutor t
    JOIN usuarios u ON u.idUsuario = t.idUsuario
    ORDER BY t.idTutor
  `;
  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET - Tutor por id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM tutor WHERE idTutor = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
    res.json(results[0]);
  });
});

// GET - Tutores por alumno
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  db.query('SELECT * FROM tutor WHERE idAlumno = ?', [idAlumno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST - Crear tutor
router.post('/', (req, res) => {
  const data = req.body;
  db.query('INSERT INTO tutor SET ?', data, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ idTutor: results.insertId, message: 'Tutor creado' });
  });
});

// PUT - Actualizar tutor
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  db.query('UPDATE tutor SET ? WHERE idTutor = ?', [data, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
    res.json({ message: 'Tutor actualizado' });
  });
});

// DELETE - Eliminar tutor
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tutor WHERE idTutor = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
    res.json({ message: 'Tutor eliminado' });
  });
});

module.exports = router;
