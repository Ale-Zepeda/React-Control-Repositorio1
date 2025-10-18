const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const crypto = require('crypto');

// Conexión directa a la base de datos
const mysql = require('mysql2');
require('dotenv').config();

const getDb = () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'controlescolar'
  });
};

// 🎯 Generar QR para un alumno
router.post('/generar', async (req, res) => {
  try {
    const { idAlumnos, fechaExpiracion } = req.body;
    
    if (!idAlumnos) {
      return res.status(400).json({ error: 'idAlumnos es requerido' });
    }

    // Generar código único
    const codigoUnico = `ALU${idAlumnos}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    // Verificar si el alumno existe
    const db = getDb();
    const [alumno] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM alumnos WHERE idAlumnos = ?', [idAlumnos], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Desactivar QR anteriores del alumno
    await new Promise((resolve, reject) => {
      db.query(
        'UPDATE QR_Alumno SET activo = FALSE WHERE idAlumnos = ?', 
        [idAlumnos], 
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Crear nuevo registro QR
    const qrId = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO QR_Alumno (idAlumnos, codigoQR, fechaExpiracion) VALUES (?, ?, ?)',
        [idAlumnos, codigoUnico, fechaExpiracion || null],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.insertId);
        }
      );
    });

    // Generar imagen QR
    const qrImageBuffer = await QRCode.toBuffer(codigoUnico, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      idQR: qrId,
      codigoQR: codigoUnico,
      qrImage: qrImageBuffer.toString('base64'),
      fechaCreacion: new Date(),
      fechaExpiracion: fechaExpiracion,
      activo: true
    });

  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🎯 Obtener QR de un alumno
router.get('/alumno/:idAlumnos', async (req, res) => {
  try {
    const { idAlumnos } = req.params;
    
    const db = getDb();
    const [qrData] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT qa.* FROM QR_Alumno qa WHERE qa.idAlumnos = ? AND qa.activo = TRUE ORDER BY qa.idQR DESC LIMIT 1`,
        [idAlumnos],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (!qrData) {
      return res.status(404).json({ error: 'QR no encontrado para este alumno' });
    }

    // Regenerar imagen QR si es necesario
    const qrImageBuffer = await QRCode.toBuffer(qrData.codigoQR, {
      width: 300,
      margin: 2
    });

    res.json({
      ...qrData,
      qrImage: qrImageBuffer.toString('base64')
    });

  } catch (error) {
    console.error('Error obteniendo QR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🎯 Escanear QR (endpoint principal)
router.post('/escanear', async (req, res) => {
  try {
    const { codigoQR, tipoMovimiento, dispositivo = 'Scanner-01', ubicacion = 'Entrada Principal' } = req.body;
    console.log('🔍 Escaneando QR:', { codigoQR, tipoMovimiento, dispositivo, ubicacion });
    
    if (!codigoQR || !tipoMovimiento) {
      return res.status(400).json({ error: 'codigoQR y tipoMovimiento son requeridos' });
    }

    if (!['entrada', 'salida'].includes(tipoMovimiento)) {
      return res.status(400).json({ error: 'tipoMovimiento debe ser "entrada" o "salida"' });
    }

    const db = getDb();

    // 1. Validar QR existe y está activo
    const [qrData] = await new Promise((resolve, reject) => {
      db.query(`
        SELECT qa.*, 
               ua.nombre as alumno_nombre, ua.Ap as alumno_apellido,
               ut.nombre as tutor_nombre, ut.Ap as tutor_apellido, ut.email as tutor_email, ut.telefono as tutor_telefono,
               t.idTutor
        FROM QR_Alumno qa 
        JOIN alumnos a ON qa.idAlumnos = a.idAlumnos
        JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
        LEFT JOIN tutor t ON t.idAlumno = a.idAlumnos
        LEFT JOIN usuarios ut ON t.idUsuario = ut.idUsuario
        WHERE qa.codigoQR = ? AND qa.activo = TRUE
        LIMIT 1
      `, [codigoQR], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!qrData) {
      console.log('❌ QR no encontrado para código:', codigoQR);
      return res.status(404).json({ error: 'Código QR no válido o inactivo' });
    }
    
    console.log('✅ QR encontrado:', { 
      idAlumnos: qrData.idAlumnos, 
      alumno: qrData.alumno_nombre,
      tutor: qrData.tutor_nombre || 'Sin tutor'
    });

    // 2. Verificar si no está expirado
    if (qrData.fechaExpiracion && new Date(qrData.fechaExpiracion) < new Date()) {
      return res.status(400).json({ error: 'Código QR expirado' });
    }

    // 3. Registrar entrada/salida
    const asistenciaId = await new Promise((resolve, reject) => {
      db.query(`
        INSERT INTO AsistenciaQR (idAlumno, tipoMovimiento, dispositivoScanner, ubicacion)
        VALUES (?, ?, ?, ?)
      `, [qrData.idAlumno, tipoMovimiento, dispositivo, ubicacion], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });

    // 4. Enviar notificación (simulada por ahora)
    const notificacionId = await enviarNotificacion(qrData, tipoMovimiento, db);

    // 5. Respuesta exitosa
    res.json({
      success: true,
      alumno: `${qrData.alumno_nombre} ${qrData.alumno_apellido}`,
      movimiento: tipoMovimiento,
      hora: new Date().toLocaleString(),
      ubicacion: ubicacion,
      dispositivo: dispositivo,
      asistenciaId: asistenciaId,
      notificacionId: notificacionId,
      tutor: qrData.tutor_nombre ? `${qrData.tutor_nombre} ${qrData.tutor_apellido}` : null
    });

  } catch (error) {
    console.error('Error procesando escaneo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🎯 Obtener asistencias de un alumno
router.get('/asistencias/alumno/:idAlumno', async (req, res) => {
  try {
    const { idAlumno } = req.params;
    const { desde, hasta, limite = 50 } = req.query;
    
    let query = `
      SELECT aq.*, a.nombre, a.apellido, a.matricula
      FROM AsistenciaQR aq
      JOIN Alumnos a ON aq.idAlumno = a.idAlumno
      WHERE aq.idAlumno = ?
    `;
    const params = [idAlumno];

    if (desde) {
      query += ' AND DATE(aq.fechaHora) >= ?';
      params.push(desde);
    }
    
    if (hasta) {
      query += ' AND DATE(aq.fechaHora) <= ?';
      params.push(hasta);
    }

    query += ' ORDER BY aq.fechaHora DESC LIMIT ?';
    params.push(parseInt(limite));

    const db = getDb();
    const asistencias = await new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(asistencias);

  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🎯 Obtener estadísticas del día
router.get('/asistencias/dia/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    
    const db = getDb();
    const registros = await new Promise((resolve, reject) => {
      db.query(`
        SELECT aq.*, a.nombre as nombreAlumno, a.apellido as apellidoAlumno, a.matricula
        FROM AsistenciaQR aq
        JOIN Alumnos a ON aq.idAlumno = a.idAlumno
        WHERE DATE(aq.fechaHora) = ?
        ORDER BY aq.fechaHora DESC
      `, [fecha], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const stats = {
      fecha: fecha,
      total: registros.length,
      entradas: registros.filter(r => r.tipoMovimiento === 'entrada').length,
      salidas: registros.filter(r => r.tipoMovimiento === 'salida').length,
      registros: registros
    };

    res.json(stats);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🎯 Función auxiliar para enviar notificaciones
async function enviarNotificacion(alumnoData, tipoMovimiento, db) {
  try {
    if (!alumnoData.tutor_email) {
      console.log('⚠️  Sin email de tutor para notificar');
      return null; // No hay tutor o email para notificar
    }

    // Guardar notificación en base de datos
    const notificacionId = await new Promise((resolve, reject) => {
      const mensaje = `${alumnoData.alumno_nombre} ${alumnoData.alumno_apellido} registró ${tipoMovimiento} a las ${new Date().toLocaleTimeString()}`;
      
      db.query(`
        INSERT INTO NotificacionesEnviadas 
        (idAlumnos, idTutor, tipoMovimiento, mensaje, metodoEnvio, estadoEnvio)
        VALUES (?, ?, ?, ?, 'email', 'pendiente')
      `, [
        alumnoData.idAlumnos, 
        alumnoData.idTutor, 
        tipoMovimiento, 
        mensaje
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });

    // Aquí se integraría con EmailJS o servicio de email
    console.log(`📧 Notificación enviada a ${alumnoData.tutor_email}: ${alumnoData.alumno_nombre} - ${tipoMovimiento}`);
    
    return notificacionId;
    
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return null;
  }
}

module.exports = router;