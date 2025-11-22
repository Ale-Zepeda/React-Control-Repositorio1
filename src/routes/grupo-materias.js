const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET - Obtener combinaciones de grupo-materia disponibles
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        CONCAT(g.idGrupo, '-', m.idMateria) as id,
        g.idGrupo,
        m.idMateria,
        CONCAT(g.especialidad, ' ', g.semestre, '° (', g.turno, ') - ', m.nombre) as label,
        g.especialidad,
        g.turno,
        g.semestre,
        m.nombre as nombreMateria
      FROM grupo g
      CROSS JOIN materia m
      WHERE g.semestre = m.semestre
      ORDER BY g.especialidad, g.semestre, g.turno, m.nombre
    `;
    
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error obteniendo grupo-materias:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;