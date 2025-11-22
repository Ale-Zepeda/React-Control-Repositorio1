const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar asignaciones por grupo
router.get('/grupo/:idGrupo', async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const [rows] = await db.query(`
      SELECT mp.idMateriaProfesor, mp.idMateria, m.nombre as materiaNombre,
             mp.idProfesor, p.idProfesor as idProf, u.nombre as profesorNombre, u.Ap as profesorAp, u.Am as profesorAm
      FROM materia_profesor mp
      JOIN materia m ON mp.idMateria = m.idMateria
      LEFT JOIN profesores p ON mp.idProfesor = p.idProfesor
      LEFT JOIN usuarios u ON p.idUsuario = u.idUsuario
      WHERE mp.idGrupo = ?
      ORDER BY m.nombre
    `, [idGrupo]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Asignar materia a grupo
router.post('/', async (req, res) => {
  try {
    const { idGrupo, idMateria, idProfesor } = req.body;
    const [ins] = await db.query('INSERT INTO materia_profesor (idMateria, idProfesor, idGrupo) VALUES (?, ?, ?)', [idMateria, idProfesor, idGrupo]);
    res.status(201).json({ idMateriaProfesor: ins.insertId });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Asignación ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Eliminar asignación
router.delete('/:idMateriaProfesor', async (req, res) => {
  try {
    const { idMateriaProfesor } = req.params;
    const [result] = await db.query('DELETE FROM materia_profesor WHERE idMateriaProfesor = ?', [idMateriaProfesor]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
