const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

async function crearDatosPrueba() {
  console.log('🔄 Creando datos de prueba...\n');

  try {
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Solo crear alumnos para probar el sistema QR
    console.log('🎓 Creando alumnos de prueba...');
    await new Promise((resolve, reject) => {
      db.query(`
        INSERT IGNORE INTO alumnos (idUsuarios, idGrupo, nombre, apellido, matricula, fechaNacimiento) VALUES
        (1, 1, 'Juan', 'Pérez', 'A001', '2010-05-15'),
        (1, 1, 'Sofia', 'Martínez', 'A002', '2010-08-22'),
        (1, 1, 'Diego', 'Hernández', 'A003', '2009-03-10'),
        (1, 1, 'Lucía', 'Rivera', 'A004', '2008-11-05')
      `, (err, results) => {
        if (err) reject(err);
        else {
          console.log(`✅ ${results.affectedRows} alumnos creados`);
          resolve(results);
        }
      });
    });

    // Verificar datos creados
    console.log('\n📊 Verificando datos...');
    
    const alumnos = await new Promise((resolve, reject) => {
      db.query('SELECT idAlumnos, nombre, apellido, matricula FROM alumnos LIMIT 5', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('👨‍🎓 Alumnos encontrados:');
    alumnos.forEach(alumno => {
      console.log(`  - ${alumno.nombre} ${alumno.apellido} (ID: ${alumno.idAlumnos}, Matrícula: ${alumno.matricula})`);
    });

    if (alumnos.length > 0) {
      console.log('\n🎉 ¡Sistema listo para probar!');
      console.log('\n📝 Para generar un QR de prueba:');
      console.log(`curl -X POST http://localhost:4000/api/qr/generar \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"idAlumnos": ${alumnos[0].idAlumnos}}'`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
  }
}

crearDatosPrueba();