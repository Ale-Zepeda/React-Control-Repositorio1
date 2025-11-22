const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

// GET - Estadísticas por día (compatibilidad con /api/asistencias/dia/:fecha)
router.get('/dia/:fecha', (req, res) => {
  const { fecha } = req.params;
  const sql = `
    SELECT 
      aq.idAsistencia,
      aq.dispositivoScanner,
      aq.idEncargadoRegistro,
      n.*,
      u.nombre as nombreAlumno,
      u.Ap as apellidoAlumno,
      CONCAT(u.nombre, ' ', IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) as nombreCompleto
    FROM asistenciaqr aq
    JOIN notificacionesenviadas n ON aq.idNotificacion = n.idNotificacion
    JOIN alumnos a ON n.idAlumnos = a.idAlumnos
    JOIN usuarios u ON a.idUsuario = u.idUsuario
    WHERE DATE(n.fechaEnvio) = ?
    ORDER BY n.fechaEnvio DESC
  `;
  db.query(sql, [fecha], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const stats = {
      fecha,
      total: results.length,
      entradas: results.filter(r => r.tipoMovimiento === 'entrada').length,
      salidas: results.filter(r => r.tipoMovimiento === 'salida').length,
      registros: results
    };
    res.json(stats);
  });
});

// GET - Asistencias por alumno (compatibilidad)
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  db.query(`
    SELECT 
      aq.idAsistencia,
      aq.dispositivoScanner,
      aq.idEncargadoRegistro,
      n.*
    FROM asistenciaqr aq 
    JOIN notificacionesenviadas n ON aq.idNotificacion = n.idNotificacion 
    WHERE n.idAlumnos = ? 
    ORDER BY n.fechaEnvio DESC`, [idAlumno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
