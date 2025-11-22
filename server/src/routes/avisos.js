const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET - Obtener todos los avisos
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.*,
        CASE 
          WHEN a.idGrupo = 1 THEN 'Aviso General'
          ELSE CONCAT(g.especialidad, ' - ', g.turno, ' - ', g.semestre, '° Semestre')
        END as nombreGrupo,
        CONCAT(ua.nombre, ' ', ua.Ap, ' ', ua.Am) as nombreAlumno,
        GROUP_CONCAT(DISTINCT CONCAT(ut.nombre, ' ', ut.Ap, ' ', ut.Am)) as nombresTutores
      FROM avisos a
      LEFT JOIN grupo g ON a.idGrupo = g.idGrupo
      LEFT JOIN alumnos al ON a.idAlumnos = al.idAlumnos
      LEFT JOIN usuarios ua ON al.idUsuario = ua.idUsuario
      LEFT JOIN tutor t ON al.idAlumnos = t.idAlumnos
      LEFT JOIN usuarios ut ON t.idUsuario = ut.idUsuario
      GROUP BY a.idAvisos
      ORDER BY a.fecha DESC, a.hora DESC
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener avisos:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET - Avisos por grupo
router.get('/grupo/:idGrupo', (req, res) => {
  const { idGrupo } = req.params;
  db.query('SELECT * FROM Avisos WHERE idGrupo = ? ORDER BY fecha DESC, hora DESC', [idGrupo], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// ...existing code...
// GET - Avisos por alumno (deduciendo grupo actual)
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  const sql = `
    SELECT av.*
    FROM Avisos av
    JOIN Grupo g ON av.idGrupo = g.idGrupo
  JOIN Alumnos a ON a.idGrupo = g.idGrupo
    WHERE a.idAlumnos = ?
    ORDER BY av.fecha DESC, av.hora DESC
  `;
  db.query(sql, [idAlumno], (err, results) => {
    if (err) return res.status(200).json([]);
    res.json(results);
  });
});

// POST - Crear aviso
router.post('/', async (req, res) => {
  const { mensaje, tipoAviso, idGrupo, idAlumnos } = req.body;
  
  if (!mensaje || !tipoAviso) {
    return res.status(400).json({ error: 'Se requiere mensaje y tipo de aviso' });
  }

  // Validar campos según el tipo de aviso
  if (tipoAviso === 'grupo' && !idGrupo) {
    return res.status(400).json({ error: 'Se requiere especificar el grupo para un aviso grupal' });
  }
  if (tipoAviso === 'alumno' && (!idGrupo || !idAlumnos)) {
    return res.status(400).json({ error: 'Se requiere especificar grupo y alumno para un aviso individual' });
  }
  
  try {
    // Verificar que el grupo exista si no es aviso general
    if (tipoAviso !== 'general') {
      const [grupos] = await db.query('SELECT idGrupo FROM grupo WHERE idGrupo = ?', [idGrupo]);
      if (grupos.length === 0) {
        return res.status(400).json({ error: 'El grupo especificado no existe' });
      }
    }

    // Si es aviso para alumno, verificar que el alumno pertenezca al grupo
    if (tipoAviso === 'alumno') {
      const [alumnos] = await db.query(
        'SELECT idAlumnos FROM alumnos WHERE idAlumnos = ? AND idGrupo = ?', 
        [idAlumnos, idGrupo]
      );
      if (alumnos.length === 0) {
        return res.status(400).json({ error: 'El alumno no pertenece al grupo especificado' });
      }
    }

    // Obtener fecha y hora actual
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().split(' ')[0];

    // Preparar los datos del aviso
    const avisoData = {
      mensaje,
      fecha,
      hora,
      idGrupo: tipoAviso === 'general' ? 1 : idGrupo,
      idAlumnos: tipoAviso === 'alumno' ? idAlumnos : null // NULL para avisos generales y grupales
    };

    const [result] = await db.query('INSERT INTO avisos SET ?', avisoData);
    
    res.status(201).json({ 
      idAvisos: result.insertId, 
      message: 'Aviso creado exitosamente'
    });
  } catch (err) {
    console.error('Error al crear aviso:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
