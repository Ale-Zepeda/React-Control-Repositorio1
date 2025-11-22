const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

async function debugQR() {
  console.log('🔍 Debug sistema QR...\n');

  try {
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. Ver QRs existentes
    const qrs = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM QR_Alumno ORDER BY idQR DESC LIMIT 3', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('📱 QRs existentes:');
    qrs.forEach(qr => {
      console.log(`  - ID: ${qr.idQR}, Código: ${qr.codigoQR}, Alumno ID: ${qr.idAlumnos}, Activo: ${qr.activo}`);
    });

    if (qrs.length > 0) {
      const testQR = qrs[0];
      console.log(`\n🔍 Probando QR: ${testQR.codigoQR}`);

      // 2. Probar consulta de escaneo
      const scanData = await new Promise((resolve, reject) => {
        db.query(`
          SELECT qa.*, 
                 ua.nombre as alumno_nombre, ua.Ap as alumno_apellido,
                 ut.nombre as tutor_nombre, ut.Ap as tutor_apellido, ut.email as tutor_email, ut.telefono as tutor_telefono,
                 t.idTutor
          FROM QR_Alumno qa 
          JOIN alumnos a ON qa.idAlumnos = a.idAlumnos
          JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
          LEFT JOIN tutor t ON t.idAlumnos = a.idAlumnos
          LEFT JOIN usuarios ut ON t.idUsuario = ut.idUsuario
          WHERE qa.codigoQR = ? AND qa.activo = TRUE
          LIMIT 1
        `, [testQR.codigoQR], (err, results) => {
          if (err) {
            console.error('❌ Error en consulta:', err.message);
            reject(err);
          } else {
            resolve(results);
          }
        });
      });

      if (scanData.length > 0) {
        console.log('✅ Consulta exitosa:');
        console.log('   Alumno:', scanData[0].alumno_nombre, scanData[0].alumno_apellido);
        console.log('   Tutor:', scanData[0].tutor_nombre || 'Sin tutor');
        console.log('   Email tutor:', scanData[0].tutor_email || 'Sin email');
      } else {
        console.log('❌ No se encontraron datos');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
  }
}

debugQR();