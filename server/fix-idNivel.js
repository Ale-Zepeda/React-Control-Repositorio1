const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

async function fixIdNivel() {
  console.log('🔧 Corrigiendo idNivel según tipo_usuario...\n');

  try {
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. Ver estado actual
    console.log('📊 Estado actual de usuarios:');
    const usuariosActuales = await new Promise((resolve, reject) => {
      db.query(`
        SELECT idUsuario, nombre, Ap, tipo_usuario, idNivel 
        FROM usuarios 
        ORDER BY idUsuario
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    usuariosActuales.forEach(user => {
      console.log(`  ID:${user.idUsuario} | ${user.nombre} ${user.Ap} | Tipo:${user.tipo_usuario} | Nivel:${user.idNivel}`);
    });

    // 2. Actualizar idNivel según tipo_usuario
    console.log('\n🔄 Actualizando niveles...');

    // Admin = 1
    const adminsUpdated = await new Promise((resolve, reject) => {
      db.query(`
        UPDATE usuarios 
        SET idNivel = 1 
        WHERE tipo_usuario = 'admin'
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log(`✅ ${adminsUpdated.affectedRows} admins actualizados -> idNivel = 1`);

    // Profesor = 2
    const profesoresUpdated = await new Promise((resolve, reject) => {
      db.query(`
        UPDATE usuarios 
        SET idNivel = 2 
        WHERE tipo_usuario = 'profesor'
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log(`✅ ${profesoresUpdated.affectedRows} profesores actualizados -> idNivel = 2`);

    // Tutor = 3
    const tutoresUpdated = await new Promise((resolve, reject) => {
      db.query(`
        UPDATE usuarios 
        SET idNivel = 3 
        WHERE tipo_usuario = 'tutor'
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log(`✅ ${tutoresUpdated.affectedRows} tutores actualizados -> idNivel = 3`);

    // Alumno = 4
    const alumnosUpdated = await new Promise((resolve, reject) => {
      db.query(`
        UPDATE usuarios 
        SET idNivel = 4 
        WHERE tipo_usuario = 'alumno'
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log(`✅ ${alumnosUpdated.affectedRows} alumnos actualizados -> idNivel = 4`);

    // 3. Verificar resultado final
    console.log('\n📊 Estado final de usuarios:');
    const usuariosFinales = await new Promise((resolve, reject) => {
      db.query(`
        SELECT u.idUsuario, u.nombre, u.Ap, u.tipo_usuario, u.idNivel, n.nivel
        FROM usuarios u
        LEFT JOIN nivel n ON u.idNivel = n.idNivel
        ORDER BY u.idNivel, u.idUsuario
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    usuariosFinales.forEach(user => {
      const match = user.idNivel === 1 && user.tipo_usuario === 'admin' ||
                   user.idNivel === 2 && user.tipo_usuario === 'profesor' ||
                   user.idNivel === 3 && user.tipo_usuario === 'tutor' ||
                   user.idNivel === 4 && user.tipo_usuario === 'alumno';
      const status = match ? '✅' : '❌';
      console.log(`  ${status} ID:${user.idUsuario} | ${user.nombre} ${user.Ap} | Tipo:${user.tipo_usuario} | Nivel:${user.idNivel}(${user.nivel || 'NULL'})`);
    });

    // 4. Estadísticas de corrección
    console.log('\n📈 Resumen de correcciones:');
    const estadisticas = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          tipo_usuario,
          idNivel,
          COUNT(*) as cantidad
        FROM usuarios 
        GROUP BY tipo_usuario, idNivel
        ORDER BY idNivel
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    estadisticas.forEach(stat => {
      console.log(`  ${stat.tipo_usuario}: ${stat.cantidad} usuarios con idNivel ${stat.idNivel}`);
    });

    // 5. Verificar integridad
    console.log('\n🔍 Verificando integridad...');
    const inconsistencias = await new Promise((resolve, reject) => {
      db.query(`
        SELECT COUNT(*) as inconsistentes
        FROM usuarios 
        WHERE 
          (tipo_usuario = 'admin' AND idNivel != 1) OR
          (tipo_usuario = 'profesor' AND idNivel != 2) OR
          (tipo_usuario = 'tutor' AND idNivel != 3) OR
          (tipo_usuario = 'alumno' AND idNivel != 4)
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (inconsistencias.inconsistentes === 0) {
      console.log('✅ ¡Todos los usuarios tienen el idNivel correcto!');
    } else {
      console.log(`❌ ${inconsistencias.inconsistentes} usuarios con idNivel incorrecto`);
    }

    console.log('\n🎉 Corrección de idNivel completada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
    console.log('\n🔚 Conexión cerrada');
  }
}

fixIdNivel();