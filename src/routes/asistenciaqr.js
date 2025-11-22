const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

// GET - Obtener asistencias de un alumno
router.get('/alumno/:idAlumno', (req, res) => {
  const { idAlumno } = req.params;
  
  const sql = `
    SELECT 
      aq.idAsistencia,
      aq.dispositivoScanner,
      ne.fechaEnvio as fecha,
      ne.tipoMovimiento as tipo,
      ne.mensaje,
      CASE 
        WHEN ne.tipoMovimiento = 'entrada' THEN 'presente'
        WHEN ne.tipoMovimiento = 'salida' THEN 'salida'
        ELSE 'ausente'
      END as estado,
      DATE_FORMAT(ne.fechaEnvio, '%H:%i') as hora
    FROM asistenciaqr aq
    JOIN notificacionesenviadas ne ON aq.idNotificacion = ne.idNotificacion
    WHERE ne.idAlumnos = ?
    ORDER BY ne.fechaEnvio DESC
  `;
  
  db.query(sql, [idAlumno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;