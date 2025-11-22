const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET - Obtener todas las materias
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT idMateria, nombre, semestre, periodo FROM materia';
    let params = [];
    
    // Filtrar por semestre si se proporciona
    if (req.query.semestre) {
      console.log(`🔍 Filtrando materias por semestre: "${req.query.semestre}"`);
      query += ' WHERE semestre = ?';
      params.push(req.query.semestre);
    } else {
      console.log('📚 Obteniendo todas las materias (sin filtro)');
    }
    
    query += ' ORDER BY nombre';
    console.log(`📝 Query SQL: ${query}`, params);
    
    const [results] = await db.query(query, params);
    console.log(`✅ Encontradas ${results.length} materias`);
    
    res.json(results);
  } catch (err) {
    console.error('❌ Error en GET /materias:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener materia por id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM materia WHERE idMateria = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Crear nueva materia
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    console.log('➕ Creando nueva materia:', payload);
    
    const [result] = await db.query('INSERT INTO materia SET ?', [payload]);
    console.log('✅ Materia creada con ID:', result.insertId);
    
    res.status(201).json({ idMateria: result.insertId });
  } catch (err) {
    console.error('❌ Error creando materia:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar materia
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE materia SET ? WHERE idMateria = ?', [req.body, id]);
    res.json({ message: 'Materia actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar materia
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM materia WHERE idMateria = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json({ message: 'Materia eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
