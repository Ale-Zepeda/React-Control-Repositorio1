const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

router.get('/', (req, res) => {
  db.query('SELECT * FROM Calificaciones', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Calificaciones por alumno
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  const sql = `
    SELECT 
      c.*,
      m.nombre as materia,
      CONCAT(u.nombre, ' ', u.Ap, ' ', u.Am) as nombreAlumno
    FROM Calificaciones c
    LEFT JOIN materia m ON m.idMateria = c.idMateria
    LEFT JOIN alumnos a ON a.idAlumnos = c.idAlumnos
    LEFT JOIN usuarios u ON u.idUsuario = a.idUsuarios
      WHERE c.idAlumnos = ?
    ORDER BY c.fecha DESC, m.nombre ASC
  `;
  db.query(sql, [idAlumno], (err, results) => {
    if (err) return res.status(200).json([]);
    res.json(results);
  });
});

// Calificaciones por grupo
router.get('/grupo/:idGrupo', (req, res) => {
  const { idGrupo } = req.params;
  const sql = `
    SELECT 
      c.*,
      m.nombre as materia,
      CONCAT(u.nombre, ' ', u.Ap, ' ', u.Am) as nombreAlumno
    FROM Calificaciones c
    JOIN alumnos a ON a.idAlumnos = c.idAlumnos
    JOIN usuarios u ON u.idUsuario = a.idUsuarios
    JOIN materia m ON m.idMateria = c.idMateria
    WHERE a.idGrupo = ?
    ORDER BY u.nombre, c.fecha DESC, m.nombre ASC
  `;
  db.query(sql, [idGrupo], (err, results) => {
    if (err) {
      console.error('Error al obtener calificaciones del grupo:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Crear nueva calificación
router.post('/', (req, res) => {
  const { idAlumnos, idMateria, calificacion, periodo, fecha, observaciones } = req.body;
  
  if (!idAlumnos || !idMateria || !calificacion || !periodo) {
    return res.status(400).json({ 
      error: 'Faltan datos requeridos',
      required: ['idAlumnos', 'idMateria', 'calificacion', 'periodo']
    });
  }

  const calificacionData = {
    idAlumnos,
    idMateria,
    calificacion: parseFloat(calificacion),
    periodo,
    fecha: fecha || new Date().toISOString().split('T')[0],
    observaciones: observaciones || ''
  };

  db.query('INSERT INTO Calificaciones SET ?', calificacionData, (err, results) => {
    if (err) {
      console.error('Error al crear calificación:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      id: results.insertId,
      message: 'Calificación creada exitosamente',
      calificacion: { ...calificacionData, idCalificacion: results.insertId }
    });
  });
});

// Actualizar calificación
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { calificacion, observaciones } = req.body;

  if (!calificacion) {
    return res.status(400).json({ error: 'La calificación es requerida' });
  }

  const updateData = {
    calificacion: parseFloat(calificacion),
    observaciones: observaciones || ''
  };

  db.query('UPDATE Calificaciones SET ? WHERE idCalificacion = ?', [updateData, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar calificación:', err);
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }
    res.json({ 
      message: 'Calificación actualizada exitosamente',
      calificacion: { id, ...updateData }
    });
  });
});

module.exports = router;
