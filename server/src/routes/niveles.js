const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

// GET - todos los niveles
router.get('/', (req, res) => {
  db.query('SELECT * FROM nivel ORDER BY idNivel', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET - nivel por id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM nivel WHERE idNivel = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Nivel no encontrado' });
    res.json(results[0]);
  });
});

// POST - crear nivel
router.post('/', (req, res) => {
  const data = req.body;
  db.query('INSERT INTO nivel SET ?', data, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ idNivel: results.insertId, message: 'Nivel creado' });
  });
});

// PUT - actualizar nivel
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  db.query('UPDATE nivel SET ? WHERE idNivel = ?', [data, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Nivel no encontrado' });
    res.json({ message: 'Nivel actualizado' });
  });
});

// DELETE - eliminar nivel
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM nivel WHERE idNivel = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Nivel no encontrado' });
    res.json({ message: 'Nivel eliminado' });
  });
});

module.exports = router;
