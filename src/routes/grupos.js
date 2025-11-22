const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todos los grupos
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT 
        g.idGrupo,
        g.especialidad,
        g.turno,
        g.semestre,
        g.totalAlumnos,
        COALESCE(COUNT(a.idAlumnos), 0) as alumnosReales
      FROM grupo g
      LEFT JOIN alumnos a ON g.idGrupo = a.idGrupo
    `;
    
    const conditions = [];
    const params = [];
    
    // Filtrar por turno si se proporciona
    if (req.query.turno) {
      conditions.push('g.turno = ?');
      params.push(req.query.turno);
      console.log(`🔍 Filtrando por turno: ${req.query.turno}`);
    }
    
    // Filtrar por especialidad si se proporciona
    if (req.query.especialidad) {
      conditions.push('g.especialidad = ?');
      params.push(req.query.especialidad);
      console.log(`🔍 Filtrando por especialidad: ${req.query.especialidad}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY g.idGrupo, g.especialidad, g.turno, g.semestre, g.totalAlumnos
      ORDER BY g.especialidad, g.semestre, g.turno
    `;
    
    const [grupos] = await db.query(query, params);
    
    // Usar el conteo real en lugar del campo totalAlumnos
    const gruposConConteoReal = grupos.map(grupo => ({
      ...grupo,
      totalAlumnos: parseInt(grupo.alumnosReales) || 0
    }));
    
    console.log(`✅ Encontrados ${gruposConConteoReal.length} grupos`);
    res.json(gruposConConteoReal);
  } catch (err) {
    console.error('Error obteniendo grupos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener alumnos de un grupo específico
router.get('/:idGrupo/alumnos', async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const [alumnos] = await db.query(`
      SELECT a.idAlumnos as idAlumno, u.nombre, u.Ap, u.Am 
      FROM alumnos a
      JOIN usuarios u ON a.idUsuario = u.idUsuario 
      WHERE a.idGrupo = ?`,
      [idGrupo]
    );
    res.json(alumnos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un grupo por ID
// Obtener especialidades únicas
router.get('/especialidades', async (req, res) => {
  try {
    console.log('🎓 Obteniendo especialidades disponibles...');
    const [especialidades] = await db.query(`
      SELECT DISTINCT especialidad 
      FROM grupo 
      WHERE especialidad IS NOT NULL AND especialidad != '' 
      ORDER BY especialidad
    `);
    
    const resultado = especialidades.map(e => e.especialidad);
    console.log(`✅ Especialidades encontradas: ${resultado.length}`, resultado);
    
    res.json(resultado);
  } catch (err) {
    console.error('❌ Error obteniendo especialidades:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener grupos con sus alumnos
router.get('/with-alumnos', async (req, res) => {
  try {
    const [grupos] = await db.query(`
      SELECT 
        g.idGrupo,
        g.especialidad,
        g.turno,
        g.semestre,
        COALESCE(COUNT(a.idAlumnos), 0) as totalAlumnos 
      FROM grupo g 
      LEFT JOIN alumnos a ON g.idGrupo = a.idGrupo 
      GROUP BY g.idGrupo, g.especialidad, g.turno, g.semestre
      ORDER BY g.especialidad, g.semestre, g.turno
    `);
    
    console.log('📊 Grupos con alumnos calculados:', grupos.map(g => `${g.especialidad} ${g.semestre}°: ${g.totalAlumnos} alumnos`));
    res.json(grupos);
  } catch (err) {
    console.error('Error obteniendo grupos con alumnos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener un grupo por ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`🔍 Obteniendo grupo con ID: ${req.params.id}`);
    
    const [grupos] = await db.query(`
      SELECT 
        g.idGrupo,
        g.especialidad,
        g.turno,
        g.semestre,
        g.totalAlumnos,
        COALESCE(COUNT(a.idAlumnos), 0) as alumnosReales
      FROM grupo g
      LEFT JOIN alumnos a ON g.idGrupo = a.idGrupo
      WHERE g.idGrupo = ?
      GROUP BY g.idGrupo, g.especialidad, g.turno, g.semestre, g.totalAlumnos
    `, [req.params.id]);
    
    if (grupos.length === 0) {
      console.log(`❌ Grupo con ID ${req.params.id} no encontrado`);
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    
    // Usar el conteo real en lugar del campo totalAlumnos
    const grupo = {
      ...grupos[0],
      totalAlumnos: parseInt(grupos[0].alumnosReales) || 0
    };
    
    console.log(`✅ Grupo encontrado:`, grupo);
    res.json(grupo);
  } catch (err) {
    console.error(`❌ Error obteniendo grupo ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Crear nuevo grupo
router.post('/', async (req, res) => {
  try {
    console.log(`➕ Creando nuevo grupo con datos:`, req.body);
    
    // Filtrar campos que no deben insertarse
    const { idGrupo, totalAlumnos, alumnosReales, ...datosGrupo } = req.body;
    
    // Establecer totalAlumnos a 0 por defecto
    const grupoCompleto = {
      ...datosGrupo,
      totalAlumnos: 0
    };
    
    console.log(`📝 Datos a insertar:`, grupoCompleto);
    
    const [result] = await db.query('INSERT INTO grupo SET ?', [grupoCompleto]);
    
    console.log(`✅ Grupo creado con ID: ${result.insertId}`);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(`❌ Error creando grupo:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar grupo
router.put('/:id', async (req, res) => {
  try {
    console.log(`🔄 Actualizando grupo ${req.params.id} con datos:`, req.body);
    
    // Filtrar campos que no deben actualizarse
    const { idGrupo, totalAlumnos, alumnosReales, ...datosActualizables } = req.body;
    
    console.log(`📝 Datos a actualizar:`, datosActualizables);
    
    const [result] = await db.query('UPDATE grupo SET ? WHERE idGrupo = ?', [datosActualizables, req.params.id]);
    
    if (result.affectedRows === 0) {
      console.log(`❌ Grupo con ID ${req.params.id} no encontrado`);
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    
    console.log(`✅ Grupo ${req.params.id} actualizado correctamente`);
    res.json({ message: 'Grupo actualizado' });
  } catch (err) {
    console.error(`❌ Error actualizando grupo ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar grupo
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Intentando eliminar grupo ${req.params.id}`);
    
    // Primero verificar si el grupo existe y contar alumnos
    const [grupoInfo] = await db.query(`
      SELECT 
        g.idGrupo,
        g.especialidad,
        g.turno,
        g.semestre,
        COUNT(a.idAlumnos) as totalAlumnos
      FROM grupo g
      LEFT JOIN alumnos a ON g.idGrupo = a.idGrupo
      WHERE g.idGrupo = ?
      GROUP BY g.idGrupo, g.especialidad, g.turno, g.semestre
    `, [req.params.id]);
    
    if (grupoInfo.length === 0) {
      console.log(`❌ Grupo ${req.params.id} no encontrado`);
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    
    const grupo = grupoInfo[0];
    const totalAlumnos = parseInt(grupo.totalAlumnos) || 0;
    
    console.log(`📊 Grupo ${grupo.especialidad} ${grupo.semestre}° (${grupo.turno}) tiene ${totalAlumnos} alumnos`);
    
    // Validar que no tenga alumnos inscritos
    if (totalAlumnos > 0) {
      console.log(`🚫 No se puede eliminar: grupo tiene ${totalAlumnos} alumno${totalAlumnos !== 1 ? 's' : ''} inscrito${totalAlumnos !== 1 ? 's' : ''}`);
      return res.status(400).json({ 
        error: `No se puede eliminar el grupo "${grupo.especialidad} ${grupo.semestre}° (${grupo.turno})" porque tiene ${totalAlumnos} alumno${totalAlumnos !== 1 ? 's' : ''} inscrito${totalAlumnos !== 1 ? 's' : ''}. Primero debe reasignar o eliminar los alumnos.`
      });
    }
    
    // Si no tiene alumnos, proceder con la eliminación
    const [result] = await db.query('DELETE FROM grupo WHERE idGrupo = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      console.log(`❌ No se pudo eliminar el grupo ${req.params.id}`);
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    
    console.log(`✅ Grupo ${grupo.especialidad} ${grupo.semestre}° (${grupo.turno}) eliminado correctamente`);
    res.json({ 
      message: `Grupo "${grupo.especialidad} ${grupo.semestre}° (${grupo.turno})" eliminado correctamente`
    });
    
  } catch (err) {
    console.error(`❌ Error eliminando grupo ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;