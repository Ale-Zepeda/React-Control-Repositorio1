const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Corrige la ruta de importación

// GET - Debug: verificar estructura de tablas
router.get('/debug/:id', (req, res) => {
  const { id } = req.params;
  console.log('Debug tutores - ID recibido:', id);
  
  db.query('SELECT * FROM tutor WHERE idUsuario = ? OR idTutor = ?', [id, id], (err, tutorResults) => {
    if (err) {
      console.error('Error consultando tutor:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Resultados tutor:', tutorResults);
    
    db.query('DESCRIBE tutor', (err2, tutorDesc) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      db.query('DESCRIBE alumnos', (err3, alumnosDesc) => {
        if (err3) return res.status(500).json({ error: err3.message });
        
        res.json({
          tutorData: tutorResults,
          tutorSchema: tutorDesc,
          alumnosSchema: alumnosDesc,
          searchId: id
        });
      });
    });
  });
});

// GET - Todos los tutores
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      t.idTutor,
      u.nombre AS nombre,
      u.Ap AS Ap,
      u.Am AS Am,
      CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) AS apellido,
      u.calle, u.colonia, u.numero, u.cp,
      u.telefono AS telefono,
      u.email AS email,
      t.idAlumnos
    FROM tutor t
    JOIN usuarios u ON u.idUsuario = t.idUsuario
    ORDER BY t.idTutor
  `;
  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET - Tutor por id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM tutor WHERE idTutor = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
    res.json(results[0]);
  });
});

// GET - Alumnos de un tutor específico
router.get('/:id/alumnos', (req, res) => {
  const { id } = req.params;
  
  // Primero verificamos si el usuario es un tutor y obtenemos su idTutor
  db.query('SELECT idTutor FROM tutor WHERE idUsuario = ? LIMIT 1', [id], (errCheck, tutorCheck) => {
    if (errCheck) {
      console.error('Error verificando tutor:', errCheck);
      return res.status(500).json({ error: errCheck.message });
    }

    if (tutorCheck.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontraron registros de tutor para este usuario',
        userId: id 
      });
    }

    const sql = `
      SELECT 
        t.idTutor,
        t.idUsuario as idUsuarioTutor,
        tu.nombre as nombreTutor,
        a.idAlumnos as idAlumno,
        u.nombre as nombre,
        u.Ap as Ap,
        u.Am as Am,
        CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) AS apellido,
        CONCAT('ALU', LPAD(a.idAlumnos, 4, '0')) AS matricula,
        g.idGrupo as grupo,
        CONCAT(g.especialidad, ' - ', g.semestre, '° ', g.turno) as nombreGrupo,
        'Estudiante' AS nivel
      FROM tutor t
      JOIN usuarios tu ON t.idUsuario = tu.idUsuario
      JOIN alumnos a ON t.idAlumnos = a.idAlumnos
      JOIN usuarios u ON a.idUsuario = u.idUsuario
      JOIN grupo g ON a.idGrupo = g.idGrupo
      WHERE t.idUsuario = ?
      ORDER BY u.nombre
    `;
    
    db.query(sql, [id, id], (err, results) => {
      if (err) {
        console.error('Error en consulta tutores:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Resultados encontrados para tutor', id, ':', results.length);
      res.json(results);
    });
  });
});

// GET - Tutores por alumno
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  db.query('SELECT * FROM tutor WHERE idAlumnos = ?', [idAlumno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST - Crear tutor
router.post('/', (req, res) => {
  const data = req.body;
  db.query('INSERT INTO tutor SET ?', data, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ idTutor: results.insertId, message: 'Tutor creado' });
  });
});

// PUT - Actualizar tutor
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  db.query('UPDATE tutor SET ? WHERE idTutor = ?', [data, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
    res.json({ message: 'Tutor actualizado' });
  });
});

// GET - Obtener notificaciones de un tutor
router.get('/:id/notificaciones', (req, res) => {
  const { id } = req.params;
  const { limite = 50 } = req.query;
  
  console.log('Buscando notificaciones para tutor ID:', id);
  
  const sql = `
    SELECT 
      n.idNotificacion,
      n.mensaje,
      n.tipoMovimiento,
      n.fechaEnvio,
      'sistema' as metodoEnvio,
      'enviado' as estadoEnvio,
      u.nombre as alumnoNombre,
      CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) as alumnoApellido,
      aq.dispositivoScanner,
      CONCAT(
        CASE 
          WHEN n.tipoMovimiento = 'entrada' THEN '🏫 '
          WHEN n.tipoMovimiento = 'salida' THEN '🚶 '
          ELSE ''
        END,
        n.mensaje
      ) as mensaje_formateado
    FROM notificacionesenviadas n
    JOIN alumnos a ON n.idAlumnos = a.idAlumnos
    JOIN usuarios u ON a.idUsuario = u.idUsuario
    LEFT JOIN asistenciaqr aq ON n.idNotificacion = aq.idNotificacion
    WHERE n.idTutor IN (
      SELECT idTutor FROM tutor WHERE idUsuario = ? OR idTutor = ?
    )
    ORDER BY n.fechaEnvio DESC
    LIMIT ?
  `;
  
  db.query(sql, [id, id, parseInt(limite)], (err, results) => {
    if (err) {
      console.error('Error consultando notificaciones:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Notificaciones encontradas:', results.length);
    res.json(results);
  });
});

// DELETE - Eliminar tutor
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tutor WHERE idTutor = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
    res.json({ message: 'Tutor eliminado' });
  });
});

// GET - Ver vinculaciones de tutor
router.get('/:idTutor/vinculaciones', (req, res) => {
  const { idTutor } = req.params;
  const sql = `
    SELECT 
      t.idTutor,
      t.idUsuario as idUsuarioTutor,
      ut.nombre as nombreTutor,
      ut.email as emailTutor,
      t.idAlumnos,
      ua.nombre as nombreAlumno,
      ua.email as emailAlumno
    FROM tutor t
    JOIN usuarios ut ON t.idUsuario = ut.idUsuario
    JOIN alumnos a ON t.idAlumnos = a.idAlumnos
    JOIN usuarios ua ON a.idUsuario = ua.idUsuario
    WHERE t.idTutor = ?
  `;
  
  db.query(sql, [idTutor], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// PUT - Actualizar vinculación tutor-alumno
router.put('/:idTutor/vincular-alumno', (req, res) => {
  const { idTutor } = req.params;
  const { idAlumnos } = req.body;
  
  if (!idAlumnos) {
    return res.status(400).json({ error: 'Se requiere idAlumnos' });
  }
  
  const sql = `UPDATE tutor SET idAlumnos = ? WHERE idTutor = ?`;
  
  db.query(sql, [idAlumnos, idTutor], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
    
    // Devolver la vinculación actualizada
    db.query(`
      SELECT t.*, 
        ut.nombre as nombreTutor, 
        ua.nombre as nombreAlumno
      FROM tutor t
      JOIN usuarios ut ON t.idUsuario = ut.idUsuario
      JOIN alumnos a ON t.idAlumnos = a.idAlumnos
      JOIN usuarios ua ON a.idUsuario = ua.idUsuario
      WHERE t.idTutor = ?
    `, [idTutor], (err2, tutor) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        message: 'Vinculación actualizada',
        tutor: tutor[0]
      });
    });
  });
});

module.exports = router;