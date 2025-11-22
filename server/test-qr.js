const QRCode = require('qrcode');
const crypto = require('crypto');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

async function testQRSystem() {
  console.log('🧪 Probando sistema QR...\n');

  try {
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. Crear un alumno ficticio directamente en la tabla
    console.log('👤 Insertando alumno de prueba...');
    await new Promise((resolve, reject) => {
      db.query('INSERT IGNORE INTO alumnos (idAlumnos, idUsuarios, idGrupo) VALUES (1, 1, 1)', (err, result) => {
        if (err) reject(err);
        else {
          console.log('✅ Alumno insertado (ID: 1)');
          resolve(result);
        }
      });
    });

    // 2. Generar código QR
    const idAlumnos = 1;
    const codigoUnico = `ALU${idAlumnos}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    console.log(`📱 Generando QR: ${codigoUnico}`);

    // 3. Guardar QR en base de datos
    const qrId = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO QR_Alumno (idAlumnos, codigoQR) VALUES (?, ?)',
        [idAlumnos, codigoUnico],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.insertId);
        }
      );
    });

    // 4. Generar imagen QR
    const qrImageBuffer = await QRCode.toBuffer(codigoUnico, {
      width: 200,
      margin: 2
    });

    console.log('✅ QR generado exitosamente');
    console.log(`📊 ID QR en BD: ${qrId}`);
    console.log(`🔢 Código: ${codigoUnico}`);
    console.log(`📏 Tamaño imagen: ${qrImageBuffer.length} bytes`);

    // 5. Simular escaneo
    console.log('\n🔍 Simulando escaneo...');
    
    const scanResult = await new Promise((resolve, reject) => {
      db.query(`
        SELECT qa.*, 'Alumno de Prueba' as nombre, 'Test' as apellido
        FROM QR_Alumno qa 
        WHERE qa.codigoQR = ? AND qa.activo = TRUE
      `, [codigoUnico], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (scanResult) {
      console.log('✅ QR válido encontrado');
      
      // Registrar asistencia
      const asistenciaId = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO AsistenciaQR (idAlumnos, tipoMovimiento) VALUES (?, ?)',
          [idAlumnos, 'entrada'],
          (err, result) => {
            if (err) reject(err);
            else resolve(result.insertId);
          }
        );
      });

      console.log(`📝 Asistencia registrada (ID: ${asistenciaId})`);
      console.log('🎉 ¡Sistema QR funcionando correctamente!');

      // Mostrar estadísticas
      const stats = await new Promise((resolve, reject) => {
        db.query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN tipoMovimiento = 'entrada' THEN 1 ELSE 0 END) as entradas,
            SUM(CASE WHEN tipoMovimiento = 'salida' THEN 1 ELSE 0 END) as salidas
          FROM AsistenciaQR 
          WHERE DATE(fechaHora) = CURDATE()
        `, (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

      console.log('\n📊 Estadísticas del día:');
      console.log(`  - Total registros: ${stats.total}`);
      console.log(`  - Entradas: ${stats.entradas}`);
      console.log(`  - Salidas: ${stats.salidas}`);

    } else {
      console.log('❌ QR no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
    console.log('\n🔚 Prueba completada');
  }
}

testQRSystem();