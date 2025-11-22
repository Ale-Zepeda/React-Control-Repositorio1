const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET - Obtener todas las asignaciones
router.get('/', async (req, res) => {
  const sql = `
    SELECT 
      u.idUsuario as idProfesor,
      CONCAT(u.nombre, ' ', u.Ap, ' ', u.Am) as nombreProfesor,
      m.idMateria,
      m.nombre as materia,
      g.idGrupo,
      CONCAT(g.grado, ' - ', g.turno) as grupo
    FROM Usuarios u
    JOIN Calificaciones c ON u.idUsuario = c.idProfesor
    JOIN Materia m ON c.idMateria = m.idMateria
    JOIN Alumnos a ON c.idAlumno = a.idAlumnos
    JOIN Grupo g ON a.idGrupo = g.idGrupo
    WHERE u.idRol = (SELECT idRol FROM Roles WHERE nombre = 'profesor')
    GROUP BY u.idUsuario, m.idMateria, g.idGrupo
    ORDER BY nombreProfesor, materia, grupo
  `;
  
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST - Crear nueva asignación
router.post('/', async (req, res) => {
  const { idProfesor, idMateria, idGrupo } = req.body;
  
  try {
    // Primero verificamos si el profesor existe y es realmente un profesor
    const [profesores] = await db.query(`
      SELECT idUsuario 
      FROM Usuarios 
      WHERE idUsuario = ? AND idRol = (SELECT idRol FROM Roles WHERE nombre = 'profesor')
    `, [idProfesor]);
    
    if (profesores.length === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }
    
    // Obtenemos los alumnos del grupo
    const [alumnos] = await db.query(`
      SELECT idAlumnos 
      FROM Alumnos 
      WHERE idGrupo = ?
    `, [idGrupo]);
    
    if (alumnos.length === 0) {
      return res.status(404).json({ error: 'No hay alumnos en este grupo' });
    }
    
    // Preparamos las calificaciones iniciales para cada alumno
    const calificaciones = alumnos.map(alumno => [
      idMateria,
      alumno.idAlumnos,
      0, // calificación inicial
      1, // primer periodo
      idProfesor
    ]);
    
    // Insertamos las calificaciones que vincularán al profesor con la materia y el grupo
    const [result] = await db.query(`
      INSERT INTO Calificaciones 
      (idMateria, idAlumno, calificacion, periodo, idProfesor) 
      VALUES ?
    `, [calificaciones]);
    
    res.status(201).json({
      message: 'Asignación creada exitosamente',
      affected: result.affectedRows
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar asignación
router.delete('/', async (req, res) => {
  const { idProfesor, idMateria, idGrupo } = req.body;
  
  try {
    const [result] = await db.query(`
      DELETE c FROM Calificaciones c
      JOIN Alumnos a ON c.idAlumno = a.idAlumnos
      WHERE c.idProfesor = ?
      AND c.idMateria = ?
      AND a.idGrupo = ?
    `, [idProfesor, idMateria, idGrupo]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }
    res.json({ message: 'Asignación eliminada exitosamente' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;