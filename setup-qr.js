const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

// Configuración de la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar',
  multipleStatements: true
});

async function setupQRTables() {
  try {
    console.log('🔄 Configurando tablas para sistema QR...\n');

    // Conectar a la base de datos
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) {
          console.error('❌ Error conectando a la base de datos:', err.message);
          reject(err);
        } else {
          console.log('✅ Conectado a la base de datos MySQL');
          resolve();
        }
      });
    });

    // Leer y ejecutar el archivo SQL
    const sqlScript = fs.readFileSync('./create-qr-tables.sql', 'utf8');
    
    await new Promise((resolve, reject) => {
      db.query(sqlScript, (err, results) => {
        if (err) {
          console.error('❌ Error ejecutando script SQL:', err.message);
          reject(err);
        } else {
          console.log('✅ Tablas QR creadas exitosamente');
          resolve(results);
        }
      });
    });

    // Verificar que las tablas existen
    const tablesCheck = await new Promise((resolve, reject) => {
      db.query(`
        SELECT TABLE_NAME as tableName, TABLE_ROWS as tableRows
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'controlescolar'}' 
        AND TABLE_NAME IN ('QR_Alumno', 'AsistenciaQR', 'NotificacionesEnviadas')
        ORDER BY TABLE_NAME
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('\n📊 Estado de las tablas:');
    tablesCheck.forEach(table => {
      console.log(`  ✅ ${table.tableName} - ${table.tableRows || 0} filas`);
    });

    // Verificar si hay alumnos para generar QRs de prueba
    const alumnosCount = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM alumnos', (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });

    if (alumnosCount > 0) {
      console.log(`\n📚 Se encontraron ${alumnosCount} alumnos en la base de datos`);
      console.log('💡 Puedes generar códigos QR usando la API: POST /api/qr/generar');
      
      // Generar QR para el primer alumno como ejemplo
      const primerAlumno = await new Promise((resolve, reject) => {
        db.query('SELECT idAlumnos, nombre, apellido FROM alumnos LIMIT 1', (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

      if (primerAlumno) {
        console.log(`\n🎯 Ejemplo de uso:`);
        console.log(`curl -X POST http://localhost:4000/api/qr/generar \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"idAlumnos": ${primerAlumno.idAlumnos}}'`);
        console.log(`\n👤 Esto generaría un QR para: ${primerAlumno.nombre} ${primerAlumno.apellido}`);
      }
    } else {
      console.log('\n⚠️  No se encontraron alumnos. Agrega algunos alumnos primero.');
    }

    console.log('\n🎉 ¡Configuración QR completada exitosamente!');
    console.log('\n📝 Endpoints disponibles:');
    console.log('  POST /api/qr/generar - Generar QR para un alumno');
    console.log('  GET  /api/qr/alumno/:id - Obtener QR de un alumno');
    console.log('  POST /api/qr/escanear - Procesar escaneo de QR');
    console.log('  GET  /api/qr/asistencias/alumno/:id - Ver asistencias');
    console.log('  GET  /api/qr/asistencias/dia/:fecha - Estadísticas del día');

  } catch (error) {
    console.error('\n❌ Error en la configuración:', error.message);
    process.exit(1);
  } finally {
    db.end();
    console.log('\n🔚 Conexión cerrada');
  }
}

// Ejecutar setup
setupQRTables();