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
  db.query('SELECT * FROM Grupo', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM Grupo WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(results[0]);
  });
});

module.exports = router;