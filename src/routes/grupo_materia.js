const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar materias asignadas a un grupo
router.get('/grupo/:idGrupo', async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const [rows] = await db.query(`
      SELECT gm.id, gm.idGrupo, gm.idMateria, gm.profesorAsignado, gm.horario, m.nombre as materiaNombre, m.semestre
      FROM grupo_materia gm
      JOIN materia m ON gm.idMateria = m.idMateria
      WHERE gm.idGrupo = ?
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
    const { idGrupo, idMateria, profesorAsignado, horario } = req.body;
    const [result] = await db.query('INSERT INTO grupo_materia (idGrupo, idMateria, profesorAsignado, horario) VALUES (?, ?, ?, ?)', [idGrupo, idMateria, profesorAsignado || null, horario || null]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    // Duplicate key (already assigned) -> return conflict
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Materia ya asignada a este grupo' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Quitar materia de grupo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM grupo_materia WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
