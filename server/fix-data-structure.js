const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar'
});

async function fixDataStructure() {
  console.log('🔧 Ajustando estructura de datos...\n');

  try {
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. Crear niveles según la estructura correcta
    console.log('📊 Creando niveles de usuario...');
    await new Promise((resolve, reject) => {
      db.query(`
        INSERT IGNORE INTO nivel (idNivel, nivel) VALUES
        (1, 'Admin'),
        (2, 'Profesor'),
        (3, 'Tutor'),
        (4, 'Alumno')
      `, (err, results) => {
        if (err) reject(err);
        else {
          console.log(`✅ ${results.affectedRows} niveles configurados`);
          resolve(results);
        }
      });
    });

    // 2. Crear usuarios con idNivel correcto
    console.log('👥 Creando usuarios con niveles...');
    await new Promise((resolve, reject) => {
      db.query(`
        INSERT IGNORE INTO usuarios (nombre, Ap, Am, email, password, tipo_usuario, idNivel) VALUES
        ('Admin', 'Sistema', '', 'admin@escuela.com', 'admin123', 'admin', 1),
        ('Prof. Juan', 'García', 'López', 'profesor1@escuela.com', 'prof123', 'profesor', 2),
        ('María', 'González', 'Martínez', 'tutor1@escuela.com', 'tutor123', 'tutor', 3),
        ('Carlos', 'Rodríguez', 'Pérez', 'tutor2@escuela.com', 'tutor123', 'tutor', 3),
        ('Juan', 'Pérez', 'Silva', 'alumno1@escuela.com', 'alumno123', 'alumno', 4),
        ('Sofia', 'Martínez', 'Rivera', 'alumno2@escuela.com', 'alumno123', 'alumno', 4),
        ('Diego', 'Hernández', 'López', 'alumno3@escuela.com', 'alumno123', 'alumno', 4)
      `, (err, results) => {
        if (err) reject(err);
        else {
          console.log(`✅ ${results.affectedRows} usuarios creados`);
          resolve(results);
        }
      });
    });

    // 3. Obtener IDs de usuarios creados
    const usuarios = await new Promise((resolve, reject) => {
      db.query(`
        SELECT idUsuario, nombre, Ap, tipo_usuario, idNivel 
        FROM usuarios 
        WHERE tipo_usuario IN ('tutor', 'alumno') 
        ORDER BY tipo_usuario, idUsuario
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const tutores = usuarios.filter(u => u.tipo_usuario === 'tutor');
    const alumnos = usuarios.filter(u => u.tipo_usuario === 'alumno');

    console.log(`👨‍👩‍👧‍👦 Encontrados ${tutores.length} tutores`);
    console.log(`🎓 Encontrados ${alumnos.length} alumnos`);

    // 4. Crear registros en tabla alumnos (vinculación con usuarios)
    if (alumnos.length > 0) {
      console.log('🎓 Vinculando alumnos...');
      for (let i = 0; i < alumnos.length; i++) {
        const alumno = alumnos[i];
        await new Promise((resolve, reject) => {
          db.query(
            'INSERT IGNORE INTO alumnos (idAlumnos, idUsuarios, idGrupo) VALUES (?, ?, ?)',
            [i + 1, alumno.idUsuario, 1], // Asignar todos al grupo 1 por ahora
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      console.log(`✅ ${alumnos.length} alumnos vinculados`);
    }

    // 5. Crear vinculación tutor-alumno
    if (tutores.length > 0 && alumnos.length > 0) {
      console.log('🔗 Creando vinculaciones tutor-alumno...');
      
      // Tutor 1 -> Alumno 1 y 2
      if (tutores[0] && alumnos[0] && alumnos[1]) {
        await new Promise((resolve, reject) => {
          db.query(`
            INSERT IGNORE INTO tutor (idTutor, idUsuario, idAlumno) VALUES
            (1, ${tutores[0].idUsuario}, 1),
            (2, ${tutores[0].idUsuario}, 2)
          `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`✅ ${tutores[0].nombre} ${tutores[0].Ap} -> Alumnos 1,2`);
      }

      // Tutor 2 -> Alumno 3
      if (tutores[1] && alumnos[2]) {
        await new Promise((resolve, reject) => {
          db.query(`
            INSERT IGNORE INTO tutor (idTutor, idUsuario, idAlumno) VALUES
            (3, ${tutores[1].idUsuario}, 3)
          `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`✅ ${tutores[1].nombre} ${tutores[1].Ap} -> Alumno 3`);
      }
    }

    // 6. Mostrar estructura final
    console.log('\n📋 Estructura final:');
    
    const finalData = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          u.idUsuario,
          u.nombre,
          u.Ap,
          u.tipo_usuario,
          n.nivel as nivel_nombre,
          a.idAlumnos,
          t.idTutor
        FROM usuarios u
        LEFT JOIN nivel n ON u.idNivel = n.idNivel
        LEFT JOIN alumnos a ON u.idUsuario = a.idUsuarios
        LEFT JOIN tutor t ON u.idUsuario = t.idUsuario
        ORDER BY u.idNivel, u.idUsuario
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    finalData.forEach(user => {
      let extras = [];
      if (user.idAlumnos) extras.push(`Alumno ID: ${user.idAlumnos}`);
      if (user.idTutor) extras.push(`Tutor ID: ${user.idTutor}`);
      const extrasStr = extras.length > 0 ? ` (${extras.join(', ')})` : '';
      
      console.log(`  ${user.nivel_nombre}: ${user.nombre} ${user.Ap}${extrasStr}`);
    });

    // 7. Mostrar vinculaciones tutor-alumno
    const vinculaciones = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          ut.nombre as tutor_nombre,
          ut.Ap as tutor_apellido,
          ua.nombre as alumno_nombre,
          ua.Ap as alumno_apellido,
          t.idAlumno
        FROM tutor t
        JOIN usuarios ut ON t.idUsuario = ut.idUsuario
        JOIN alumnos a ON t.idAlumno = a.idAlumnos
        JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('\n👨‍👩‍👧‍👦 Vinculaciones Tutor-Alumno:');
    vinculaciones.forEach(v => {
      console.log(`  ${v.tutor_nombre} ${v.tutor_apellido} -> ${v.alumno_nombre} ${v.alumno_apellido} (ID: ${v.idAlumno})`);
    });

    console.log('\n🎉 ¡Estructura de datos configurada correctamente!');
    
    // IDs para generar QRs
    const alumnosIds = await new Promise((resolve, reject) => {
      db.query('SELECT idAlumnos FROM alumnos ORDER BY idAlumnos', (err, results) => {
        if (err) reject(err);
        else resolve(results.map(r => r.idAlumnos));
      });
    });

    if (alumnosIds.length > 0) {
      console.log('\n📱 Para generar QRs de prueba:');
      alumnosIds.forEach((id, index) => {
        console.log(`curl -X POST http://localhost:4000/api/qr/generar -H "Content-Type: application/json" -d '{"idAlumnos": ${id}}'`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
    console.log('\n🔚 Configuración completada');
  }
}

fixDataStructure();