const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

// Get all talleres with student info
router.get('/', (req, res) => {
  const sql = `
    SELECT DISTINCT
      t.*,
      GROUP_CONCAT(
        CONCAT(u.nombre, ' ', u.Ap, ' ', u.Am)
        SEPARATOR ', '
      ) as alumnosAsignados
    FROM talleres t
    LEFT JOIN talleres_alumnos ta ON t.idTalleres = ta.idTalleres
    LEFT JOIN alumnos a ON ta.idAlumnos = a.idAlumnos
    LEFT JOIN usuarios u ON a.idUsuario = u.idUsuario
    GROUP BY t.idTalleres
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Create new taller (solo nombre y profesor)
router.post('/', (req, res) => {
  const { nombreT, profesor } = req.body;

  const insertTaller = 'INSERT INTO talleres (nombreT, profesor) VALUES (?, ?)';
  db.query(insertTaller, [nombreT, profesor], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const idTalleres = result.insertId;
    res.json({ 
      idTalleres, 
      message: 'Taller creado exitosamente'
    });
  });
});

// Update taller
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombreT, profesor } = req.body;

  const updateTaller = 'UPDATE talleres SET nombreT = ?, profesor = ? WHERE idTalleres = ?';
  db.query(updateTaller, [nombreT, profesor, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      message: 'Taller actualizado exitosamente'
    });
  });
});

// Asignar alumno a taller
router.post('/:id/alumnos', (req, res) => {
  const { id } = req.params;
  const { idAlumnos } = req.body;

  const insertAsignacion = 'INSERT INTO talleres_alumnos (idTalleres, idAlumnos) VALUES (?, ?)';
  db.query(insertAsignacion, [id, idAlumnos], (err) => {
    if (err) {
      // Si ya existe la asignación, enviar mensaje específico
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'El alumno ya está asignado a este taller'
        });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      message: 'Alumno asignado exitosamente al taller'
    });
  });
});

// Delete taller
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM talleres WHERE idTalleres = ?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Taller eliminado exitosamente' });
  });
});

// Eliminar alumno de un taller
router.delete('/:id/alumnos/:idAlumno', (req, res) => {
  const { id, idAlumno } = req.params;
  
  const sql = 'DELETE FROM talleres_alumnos WHERE idTalleres = ? AND idAlumnos = ?';
  db.query(sql, [id, idAlumno], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Alumno removido exitosamente del taller' });
  });
});

// Get talleres by student
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  const sql = `
    SELECT t.*, u.nombre as nombreAlumno, u.Ap as ApAlumno, u.Am as AmAlumno
    FROM talleres t
    JOIN alumnos a ON t.idAlumnos = a.idAlumnos
    JOIN usuarios u ON a.idUsuario = u.idUsuario
    WHERE a.idAlumnos = ?
  `;
  
  db.query(sql, [idAlumno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get students assigned to a taller
router.get('/:id/alumnos', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      a.idAlumnos,
      u.nombre,
      u.Ap,
      u.Am,
      g.especialidad,
      g.semestre,
      g.turno,
      ta.fecha_asignacion
    FROM talleres_alumnos ta
    JOIN alumnos a ON ta.idAlumnos = a.idAlumnos
    JOIN usuarios u ON a.idUsuario = u.idUsuario
    LEFT JOIN grupo g ON a.idGrupo = g.idGrupo
    WHERE ta.idTalleres = ?
    ORDER BY ta.fecha_asignacion DESC
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
