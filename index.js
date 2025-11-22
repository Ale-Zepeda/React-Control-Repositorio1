const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Control Escolar funcionando correctamente',
    version: '1.0.0',
    database: 'controlescolar'
  });
});

// Ruta de prueba para verificar conexión a BD
app.get('/api/test-db', async (req, res) => {
  try {
    const [results] = await db.query('SELECT 1 + 1 AS resultado');
    res.json({ 
      message: 'Conexión a BD exitosa',
      resultado: results[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// Ruta para ver estructura de la base de datos
app.get('/api/db-structure', async (req, res) => {
  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    const structure = {};
    for (const tableName of tableNames) {
      try {
        const [columns] = await db.query(`DESCRIBE \`${tableName}\``);
        structure[tableName] = columns;
      } catch (e) {
        structure[tableName] = { error: e.message };
      }
    }
    
    res.json({ 
      message: 'Estructura de BD',
      tables: tableNames,
      structure
    });
  } catch (err) {
    res.status(500).json({ error: 'Error consultando estructura', details: err.message });
  }
});

// Rutas de autenticación
app.use('/api/auth', require('./src/routes/auth'));

// Rutas para las entidades principales
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/alumnos', require('./src/routes/alumnos'));
app.use('/api/grupos', require('./src/routes/grupos'));
app.use('/api/avisos', require('./src/routes/avisos'));
app.use('/api/materias', require('./src/routes/materias'));
// Rutas para asignaciones materia-profesor-grupo
app.use('/api/materia_profesor', require('./src/routes/materia_profesor'));
app.use('/api/grupo_materia', require('./src/routes/grupo_materia'));
app.use('/api/grupo-materias', require('./src/routes/grupo-materias'));
app.use('/api/calificaciones', require('./src/routes/calificaciones'));
app.use('/api/talleres', require('./src/routes/talleres'));
app.use('/api/asistenciaqr', require('./src/routes/asistenciaqr'));
app.use('/api/tutores', require('./src/routes/tutores'));
app.use('/api/profesores', require('./src/routes/profesores'));
app.use('/api/niveles', require('./src/routes/niveles'));
app.use('/api/asistenciaqr', require('./src/routes/asistenciaqr'));
app.use('/api/asistencias', require('./src/routes/asistencias'));
app.use('/api/asignaciones', require('./src/routes/asignaciones'));

// Rutas del sistema QR
app.use('/api/qr', require('./src/routes/qr'));

// Endpoint de prueba para tutores
app.get('/api/test-tutor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si existe como tutor
    const [tutorData] = await db.query('SELECT * FROM tutor WHERE idUsuario = ? OR idTutor = ?', [id, id]);
    
    // Verificar si existe como usuario
    const [userData] = await db.query('SELECT * FROM usuarios WHERE idUsuario = ?', [id]);
    
    // Ver todos los tutores
    const [allTutores] = await db.query('SELECT * FROM tutor');
    
    // Ver todos los alumnos
    const [allAlumnos] = await db.query('SELECT * FROM alumnos');
    
    // Ver todos los usuarios tipo tutor
    const [usuariosTutor] = await db.query('SELECT * FROM usuarios WHERE tipo_usuario = "tutor"');
    
    // Ver todos los usuarios tipo alumno
    const [usuariosAlumno] = await db.query('SELECT * FROM usuarios WHERE tipo_usuario = "alumno"');
    
    res.json({
      searchId: id,
      tutorFound: tutorData,
      userFound: userData,
      allTutores: allTutores,
      allAlumnos: allAlumnos,
      usuariosTutor: usuariosTutor,
      usuariosAlumno: usuariosAlumno,
      message: tutorData.length > 0 ? 'Tutor encontrado' : 'Tutor NO encontrado'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para crear vinculaciones tutor-alumno automáticamente
app.post('/api/create-tutor-links', async (req, res) => {
  try {
    // Obtener todos los usuarios tipo tutor que no tienen registro en tabla tutor
    const [usuariosTutorSinVinculo] = await db.query(`
      SELECT u.* FROM usuarios u 
      LEFT JOIN tutor t ON u.idUsuario = t.idUsuario 
      WHERE u.tipo_usuario = 'tutor' AND t.idUsuario IS NULL
    `);
    
    // Obtener todos los usuarios tipo alumno
    const [usuariosAlumno] = await db.query(`
      SELECT u.idUsuario, a.idAlumnos 
      FROM usuarios u 
      JOIN alumnos a ON u.idUsuario = a.idUsuario 
      WHERE u.tipo_usuario = 'alumno'
    `);
    
    const vinculacionesCreadas = [];
    
    // Crear vinculaciones automáticas (cada tutor con el primer alumno disponible)
    for (let i = 0; i < usuariosTutorSinVinculo.length && i < usuariosAlumno.length; i++) {
      const tutor = usuariosTutorSinVinculo[i];
      const alumno = usuariosAlumno[i];
      
      await db.query(
        'INSERT INTO tutor (idUsuario, idAlumno) VALUES (?, ?)',
        [tutor.idUsuario, alumno.idAlumnos]
      );
      
      vinculacionesCreadas.push({
        tutorId: tutor.idUsuario,
        tutorNombre: tutor.nombre,
        alumnoId: alumno.idAlumnos,
        alumnoUsuarioId: alumno.idUsuario
      });
    }
    
    res.json({
      message: 'Vinculaciones creadas',
      vinculacionesCreadas: vinculacionesCreadas,
      total: vinculacionesCreadas.length
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para crear datos de prueba
app.post('/api/create-test-data', async (req, res) => {
  try {
    const testData = {
      usuariosCreados: [],
      alumnosCreados: [],
      tutoresCreados: [],
      gruposCreados: [],
      materiasCreadas: []
    };
    
    // 1. Crear grupo de prueba si no existe
    const [gruposExistentes] = await db.query('SELECT * FROM grupo LIMIT 1');
    if (gruposExistentes.length === 0) {
      await db.query("INSERT INTO grupo (grado, turno) VALUES ('1° Secundaria', 'Matutino')");
      await db.query("INSERT INTO grupo (grado, turno) VALUES ('2° Secundaria', 'Matutino')");
      testData.gruposCreados = ['1° Secundaria - Matutino', '2° Secundaria - Matutino'];
    }
    
    // 2. Crear materias de prueba si no existen
    const [materiasExistentes] = await db.query('SELECT * FROM materia LIMIT 1');
    if (materiasExistentes.length === 0) {
      await db.query("INSERT INTO materia (nombre, semestre) VALUES ('Matemáticas', '1')");
      await db.query("INSERT INTO materia (nombre, semestre) VALUES ('Español', '1')");
      await db.query("INSERT INTO materia (nombre, semestre) VALUES ('Ciencias', '1')");
      testData.materiasCreadas = ['Matemáticas', 'Español', 'Ciencias'];
    }
    
    // 3. Crear usuarios de prueba
    const usuariosPrueba = [
      { nombre: 'Juan', Ap: 'Pérez', Am: 'López', email: 'tutor1@test.com', password: 'tutor123', tipo_usuario: 'tutor', calle: 'Calle 1', colonia: 'Centro', numero: '123', cp: 12345, telefono: 555123456, idNivel: 3 },
      { nombre: 'María', Ap: 'González', Am: 'Ruiz', email: 'tutor2@test.com', password: 'tutor123', tipo_usuario: 'tutor', calle: 'Calle 2', colonia: 'Norte', numero: '456', cp: 12346, telefono: 555765432, idNivel: 3 },
      { nombre: 'Pedro', Ap: 'Martínez', Am: 'Silva', email: 'alumno1@test.com', password: 'alumno123', tipo_usuario: 'alumno', calle: 'Calle 3', colonia: 'Sur', numero: '789', cp: 12347, telefono: 555987654, idNivel: 4 },
      { nombre: 'Ana', Ap: 'López', Am: 'Torres', email: 'alumno2@test.com', password: 'alumno123', tipo_usuario: 'alumno', calle: 'Calle 4', colonia: 'Este', numero: '101', cp: 12348, telefono: 555345678, idNivel: 4 },
      { nombre: 'Carlos', Ap: 'Rodríguez', Am: 'Morales', email: 'profesor1@test.com', password: 'prof123', tipo_usuario: 'profesor', calle: 'Calle 5', colonia: 'Oeste', numero: '202', cp: 12349, telefono: 555654321, idNivel: 2 }
    ];
    
    for (const usuario of usuariosPrueba) {
      // Verificar si ya existe
      const [existeUsuario] = await db.query('SELECT idUsuario FROM usuarios WHERE email = ?', [usuario.email]);
      
        if (existeUsuario.length === 0) {
        const resultado = await db.query('INSERT INTO usuarios SET ?', usuario);
        const idUsuarioCreado = resultado[0].insertId;
        
        testData.usuariosCreados.push({
          id: idUsuarioCreado,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.tipo_usuario
        });
        
        // Si es alumno, crear registro en tabla alumnos
        if (usuario.tipo_usuario === 'alumno') {
          await db.query('INSERT INTO alumnos (idUsuario, idGrupo) VALUES (?, 1)', [idUsuarioCreado]);
          const [alumnoCreado] = await db.query('SELECT idAlumnos FROM alumnos WHERE idUsuario = ?', [idUsuarioCreado]);
          testData.alumnosCreados.push({
            idAlumno: alumnoCreado[0].idAlumnos,
            idUsuario: idUsuarioCreado,
            nombre: usuario.nombre
          });
        }
      }
    }
    
    // 4. Crear vinculaciones tutor-alumno
    const [tutores] = await db.query('SELECT u.idUsuario, u.nombre FROM usuarios u WHERE tipo_usuario = "tutor"');
  const [alumnos] = await db.query('SELECT u.idUsuario, a.idAlumnos, u.nombre FROM usuarios u JOIN alumnos a ON u.idUsuario = a.idUsuario WHERE tipo_usuario = "alumno"');
    
    for (let i = 0; i < tutores.length && i < alumnos.length; i++) {
      // Verificar si ya existe la vinculación
      const [vinculacionExiste] = await db.query('SELECT * FROM tutor WHERE idUsuario = ? AND idAlumnos = ?', [tutores[i].idUsuario, alumnos[i].idAlumnos]);
      
      if (vinculacionExiste.length === 0) {
        await db.query('INSERT INTO tutor (idUsuario, idAlumnos) VALUES (?, ?)', [tutores[i].idUsuario, alumnos[i].idAlumnos]);
        testData.tutoresCreados.push({
          tutorNombre: tutores[i].nombre,
          tutorId: tutores[i].idUsuario,
          alumnoNombre: alumnos[i].nombre,
          alumnoId: alumnos[i].idAlumnos
        });
      }
    }
    
    res.json({
      message: 'Datos de prueba creados exitosamente',
      data: testData
    });
    
  } catch (error) {
    console.error('Error creando datos de prueba:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de debug para ver todas las notificaciones
app.get('/api/debug-notificaciones', async (req, res) => {
  try {
    const [notificaciones] = await db.query('SELECT * FROM notificacionesenviadas ORDER BY fechaEnvio DESC');
    const [tutores] = await db.query('SELECT * FROM tutor');
    const [asistencias] = await db.query('SELECT * FROM asistenciaqr ORDER BY fechaHora DESC LIMIT 10');
    
    res.json({
      message: 'Debug notificaciones',
      notificaciones: notificaciones,
      tutores: tutores,
      asistencias: asistencias,
      totalNotificaciones: notificaciones.length,
      totalTutores: tutores.length,
      totalAsistencias: asistencias.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de diagnóstico completo para alumno
app.get('/api/debug-alumno/:id', async (req, res) => {
  try {
    const { id } = req.params; // puede ser idUsuario o idAlumno
    
    // 1. Buscar usuario
    const [usuario] = await db.query('SELECT * FROM usuarios WHERE idUsuario = ?', [id]);
    
    // 2. Buscar alumno por idUsuario
  const [alumnoPorUsuario] = await db.query('SELECT * FROM alumnos WHERE idUsuario = ?', [id]);
    
    // 3. Buscar alumno por idAlumnos directamente
    const [alumnoPorId] = await db.query('SELECT * FROM alumnos WHERE idAlumnos = ?', [id]);
    
    // 4. Buscar todos los QRs
    const [todosQRs] = await db.query('SELECT * FROM qr_alumno ORDER BY idQR DESC');
    
    // 5. QRs específicos del alumno
    let qrsAlumno = [];
    if (alumnoPorUsuario.length > 0) {
      const [qrs] = await db.query('SELECT * FROM qr_alumno WHERE idAlumnos = ?', [alumnoPorUsuario[0].idAlumnos]);
      qrsAlumno = qrs;
    }
    
    // 6. Relación completa usuario->alumno->qr
    const [relacionCompleta] = await db.query(`
      SELECT 
        u.idUsuario, u.nombre as usuarioNombre, u.email,
        a.idAlumnos, 
        q.idQR, q.codigoQR, q.activo
      FROM usuarios u
      LEFT JOIN alumnos a ON u.idUsuario = a.idUsuario
      LEFT JOIN qr_alumno q ON a.idAlumnos = q.idAlumnos
      WHERE u.idUsuario = ?
    `, [id]);
    
    res.json({
      searchId: id,
      usuario: usuario,
      alumnoPorUsuario: alumnoPorUsuario,
      alumnoPorId: alumnoPorId,
      qrsAlumno: qrsAlumno,
      relacionCompleta: relacionCompleta,
      todosQRs: todosQRs.slice(0, 5), // Solo los primeros 5
      resumen: {
        usuarioEncontrado: usuario.length > 0,
        alumnoEncontrado: alumnoPorUsuario.length > 0,
        tieneQR: qrsAlumno.length > 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

// Endpoint para corregir inconsistencias de IDs entre tablas
app.post('/api/fix-data-consistency', async (req, res) => {
  try {
    const corrections = {
      usuariosActualizados: [],
      alumnosCorregidos: [],
      qrsCorregidos: [],
      errores: []
    };
    
    // 1. Obtener todos los usuarios tipo alumno
    const [usuariosAlumnos] = await db.query(`
      SELECT idUsuario, nombre, email, tipo_usuario 
      FROM usuarios 
      WHERE tipo_usuario = 'alumno'
      ORDER BY idUsuario
    `);
    
    // 2. Para cada usuario alumno, verificar/corregir su registro en alumnos
    for (const usuario of usuariosAlumnos) {
      try {
        // Verificar si existe en tabla alumnos
        const [alumnoExiste] = await db.query(
          'SELECT * FROM alumnos WHERE idUsuarios = ?', 
          [usuario.idUsuario]
        );
        
        if (alumnoExiste.length === 0) {
          // Si no existe, crear registro en alumnos
          await db.query(
            'INSERT INTO alumnos (idUsuarios, idGrupo) VALUES (?, 1)',
            [usuario.idUsuario]
          );
          
          const [nuevoAlumno] = await db.query(
            'SELECT idAlumnos FROM alumnos WHERE idUsuarios = ? ORDER BY idAlumnos DESC LIMIT 1',
            [usuario.idUsuario]
          );
          
          corrections.alumnosCorregidos.push({
            accion: 'creado',
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombre,
            idAlumno: nuevoAlumno[0].idAlumnos
          });
        }
        
        // 3. Obtener idAlumnos correcto
        const [alumnoData] = await db.query(
          'SELECT idAlumnos FROM alumnos WHERE idUsuarios = ?',
          [usuario.idUsuario]
        );
        
        const idAlumnosCorrecto = alumnoData[0].idAlumnos;
        
        // 4. Verificar/corregir QRs
        const [qrsIncorrectos] = await db.query(`
          SELECT * FROM qr_alumno 
          WHERE codigoQR LIKE ? AND idAlumnos != ?
        `, [`ALU${usuario.idUsuario}%`, idAlumnosCorrecto]);
        
        // Corregir QRs que tienen el patrón del usuario pero idAlumnos incorrecto
        for (const qrIncorrecto of qrsIncorrectos) {
          await db.query(
            'UPDATE qr_alumno SET idAlumnos = ? WHERE idQR = ?',
            [idAlumnosCorrecto, qrIncorrecto.idQR]
          );
          
          corrections.qrsCorregidos.push({
            idQR: qrIncorrecto.idQR,
            codigoQR: qrIncorrecto.codigoQR,
            idAlumnosAnterior: qrIncorrecto.idAlumnos,
            idAlumnosNuevo: idAlumnosCorrecto,
            usuario: usuario.nombre
          });
        }
        
      } catch (error) {
        corrections.errores.push({
          usuario: usuario.nombre,
          idUsuario: usuario.idUsuario,
          error: error.message
        });
      }
    }
    
    // 5. Limpiar QRs huérfanos (que no tienen alumno válido)
    const [qrsHuerfanos] = await db.query(`
      SELECT q.* FROM qr_alumno q
      LEFT JOIN alumnos a ON q.idAlumnos = a.idAlumnos
      WHERE a.idAlumnos IS NULL
    `);
    
    for (const qrHuerfano of qrsHuerfanos) {
      await db.query('DELETE FROM qr_alumno WHERE idQR = ?', [qrHuerfano.idQR]);
      corrections.qrsCorregidos.push({
        accion: 'eliminado',
        idQR: qrHuerfano.idQR,
        codigoQR: qrHuerfano.codigoQR,
        motivo: 'QR huérfano sin alumno válido'
      });
    }
    
    res.json({
      message: 'Corrección de inconsistencias completada',
      corrections: corrections,
      resumen: {
        alumnosCorregidos: corrections.alumnosCorregidos.length,
        qrsCorregidos: corrections.qrsCorregidos.length,
        errores: corrections.errores.length
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Error corrigiendo inconsistencias', 
      details: error.message 
    });
  }
});

// Endpoint para LIMPIAR Y REORGANIZAR completamente los IDs de usuario
app.post('/api/clean-and-reorganize-ids', async (req, res) => {
  try {
    const report = {
      duplicadosEliminados: [],
      idsReorganizados: [],
      tablaslimpiadas: [],
      errores: []
    };
    
    // PASO 1: Identificar usuarios únicos por email (email es único)
    const [usuariosUnicos] = await db.query(`
      SELECT 
        MIN(idUsuario) as idPrincipal, 
        email, 
        MIN(nombre) as nombre, 
        MIN(tipo_usuario) as tipo_usuario, 
        COUNT(*) as duplicados
      FROM usuarios 
      GROUP BY email
      ORDER BY MIN(idUsuario)
    `);
    
    console.log('👥 Usuarios encontrados:', usuariosUnicos.length);
    
    // PASO 2: Para cada usuario único, limpiar duplicados
    for (const usuarioUnico of usuariosUnicos) {
      try {
        const { idPrincipal, email, nombre, tipo_usuario } = usuarioUnico;
        
        // Obtener TODOS los IDs de este usuario (duplicados)
        const [todosLosIds] = await db.query(
          'SELECT idUsuario FROM usuarios WHERE email = ? ORDER BY idUsuario',
          [email]
        );
        
        const idsAEliminar = todosLosIds.filter(u => u.idUsuario !== idPrincipal).map(u => u.idUsuario);
        
        if (idsAEliminar.length > 0) {
          console.log(`🔄 Consolidando usuario ${nombre} (${email}): ID principal ${idPrincipal}, eliminando IDs:`, idsAEliminar);
          
          // PASO 3: Si es alumno, mover/consolidar registros de tabla alumnos
          if (tipo_usuario === 'alumno') {
            for (const idEliminar of idsAEliminar) {
              // Mover registros de alumnos al ID principal
              const [registrosAlumno] = await db.query('SELECT * FROM alumnos WHERE idUsuarios = ?', [idEliminar]);
              
              for (const registro of registrosAlumno) {
                // Verificar si ya existe registro para el ID principal
                const [yaExiste] = await db.query('SELECT idAlumnos FROM alumnos WHERE idUsuarios = ?', [idPrincipal]);
                
                if (yaExiste.length === 0) {
                  // Actualizar el registro existente para usar el ID principal
                  await db.query(
                    'UPDATE alumnos SET idUsuarios = ? WHERE idAlumnos = ?',
                    [idPrincipal, registro.idAlumnos]
                  );
                  
                  report.idsReorganizados.push({
                    tabla: 'alumnos',
                    idAlumnos: registro.idAlumnos,
                    idUsuarioAnterior: idEliminar,
                    idUsuarioNuevo: idPrincipal,
                    usuario: nombre
                  });
                } else {
                  // Ya existe, eliminar el duplicado
                  await db.query('DELETE FROM alumnos WHERE idAlumnos = ?', [registro.idAlumnos]);
                  report.duplicadosEliminados.push({
                    tabla: 'alumnos',
                    idAlumnos: registro.idAlumnos,
                    motivo: 'Duplicado eliminado'
                  });
                }
              }
            }
          }
          
          // PASO 4: Eliminar usuarios duplicados
          for (const idEliminar of idsAEliminar) {
            await db.query('DELETE FROM usuarios WHERE idUsuario = ?', [idEliminar]);
            report.duplicadosEliminados.push({
              tabla: 'usuarios',
              idUsuario: idEliminar,
              email: email,
              motivo: 'Usuario duplicado eliminado'
            });
          }
        }
        
        // PASO 5: Asegurar que el alumno tenga su registro en tabla alumnos
        if (tipo_usuario === 'alumno') {
          const [tieneRegistroAlumno] = await db.query(
            'SELECT idAlumnos FROM alumnos WHERE idUsuarios = ?',
            [idPrincipal]
          );
          
          if (tieneRegistroAlumno.length === 0) {
            await db.query(
              'INSERT INTO alumnos (idUsuarios, idGrupo) VALUES (?, 1)',
              [idPrincipal]
            );
            
            const [nuevoRegistro] = await db.query(
              'SELECT idAlumnos FROM alumnos WHERE idUsuarios = ? ORDER BY idAlumnos DESC LIMIT 1',
              [idPrincipal]
            );
            
            report.idsReorganizados.push({
              tabla: 'alumnos',
              accion: 'creado',
              idUsuario: idPrincipal,
              idAlumnos: nuevoRegistro[0].idAlumnos,
              usuario: nombre
            });
          }
        }
        
      } catch (error) {
        report.errores.push({
          usuario: usuarioUnico.nombre,
          email: usuarioUnico.email,
          error: error.message
        });
      }
    }
    
    // PASO 6: Limpiar QRs huérfanos y corregir referencias
    const [qrsHuerfanos] = await db.query(`
      SELECT q.* FROM qr_alumno q
      LEFT JOIN alumnos a ON q.idAlumnos = a.idAlumnos
      WHERE a.idAlumnos IS NULL
    `);
    
    for (const qr of qrsHuerfanos) {
      await db.query('DELETE FROM qr_alumno WHERE idQR = ?', [qr.idQR]);
      report.duplicadosEliminados.push({
        tabla: 'qr_alumno',
        idQR: qr.idQR,
        codigoQR: qr.codigoQR,
        motivo: 'QR huérfano eliminado'
      });
    }
    
    // PASO 7: Limpiar registros de tutor huérfanos
    const [tutoresHuerfanos] = await db.query(`
      SELECT t.* FROM tutor t
      LEFT JOIN usuarios u ON t.idUsuario = u.idUsuario
      LEFT JOIN alumnos a ON t.idAlumno = a.idAlumnos
      WHERE u.idUsuario IS NULL OR a.idAlumnos IS NULL
    `);
    
    for (const tutor of tutoresHuerfanos) {
      await db.query('DELETE FROM tutor WHERE idTutor = ?', [tutor.idTutor]);
      report.duplicadosEliminados.push({
        tabla: 'tutor',
        idTutor: tutor.idTutor,
        motivo: 'Relación tutor huérfana eliminada'
      });
    }
    
    res.json({
      message: '🎉 LIMPIEZA COMPLETA DE IDS REALIZADA',
      report: report,
      resumen: {
        usuariosProcesados: usuariosUnicos.length,
        duplicadosEliminados: report.duplicadosEliminados.length,
        idsReorganizados: report.idsReorganizados.length,
        errores: report.errores.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: '💥 Error en limpieza de IDs',
      details: error.message,
      stack: error.stack
    });
  }
});

// Endpoint para ver usuarios actuales y actualizar sus credenciales
app.get('/api/usuarios-actuales', async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT idUsuario, nombre, Ap, Am, email, tipo_usuario 
      FROM usuarios 
      ORDER BY tipo_usuario, idUsuario
    `);
    
    res.json({
      message: 'Usuarios actuales en el sistema',
      usuarios: usuarios,
      total: usuarios.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para actualizar credenciales de usuarios
app.post('/api/actualizar-credenciales', async (req, res) => {
  try {
    const updates = [];
    
    // Credenciales únicas por rol
    const nuevasCredenciales = [
      // ADMINISTRADORES
      { tipoUsuario: 'admin', nombre: 'Admin', email: 'admin@escuela.com', password: 'admin123' },
      
      // PROFESORES
      { tipoUsuario: 'profesor', nombre: 'Carlos', email: 'carlos.profesor@escuela.com', password: 'prof123' },
      { tipoUsuario: 'profesor', nombre: 'Profesor', email: 'profesor@example.com', password: 'profesor123' },
      
      // TUTORES
      { tipoUsuario: 'tutor', nombre: 'Juan', email: 'juan.tutor@escuela.com', password: 'tutor123' },
      { tipoUsuario: 'tutor', nombre: 'María', email: 'maria.tutor@escuela.com', password: 'tutor456' },
      
      // ALUMNOS
      { tipoUsuario: 'alumno', nombre: 'Pedro', email: 'pedro.alumno@escuela.com', password: 'alumno123' },
      { tipoUsuario: 'alumno', nombre: 'Ana', email: 'ana.alumno@escuela.com', password: 'alumno456' },
      { tipoUsuario: 'alumno', nombre: 'Sofia', email: 'sofia.alumno@escuela.com', password: 'alumno789' }
    ];
    
    // Obtener usuarios actuales por tipo
    for (const credencial of nuevasCredenciales) {
      const [usuarioExistente] = await db.query(`
        SELECT idUsuario, nombre, email 
        FROM usuarios 
        WHERE tipo_usuario = ? AND (nombre LIKE ? OR email LIKE ?)
        ORDER BY idUsuario 
        LIMIT 1
      `, [credencial.tipoUsuario, `%${credencial.nombre}%`, `%${credencial.email.split('@')[0]}%`]);
      
      if (usuarioExistente.length > 0) {
        const usuario = usuarioExistente[0];
        
        // Actualizar email y contraseña
        await db.query(
          'UPDATE usuarios SET email = ?, password = ? WHERE idUsuario = ?',
          [credencial.email, credencial.password, usuario.idUsuario]
        );
        
        updates.push({
          idUsuario: usuario.idUsuario,
          nombreAnterior: usuario.nombre,
          emailAnterior: usuario.email,
          emailNuevo: credencial.email,
          passwordNuevo: credencial.password,
          rol: credencial.tipoUsuario
        });
      } else {
        // Si no existe usuario de este tipo, buscar cualquiera del tipo y actualizar
        const [cualquierUsuario] = await db.query(
          'SELECT idUsuario, nombre, email FROM usuarios WHERE tipo_usuario = ? ORDER BY idUsuario LIMIT 1',
          [credencial.tipoUsuario]
        );
        
        if (cualquierUsuario.length > 0) {
          const usuario = cualquierUsuario[0];
          
          await db.query(
            'UPDATE usuarios SET email = ?, password = ?, nombre = ? WHERE idUsuario = ?',
            [credencial.email, credencial.password, credencial.nombre, usuario.idUsuario]
          );
          
          updates.push({
            idUsuario: usuario.idUsuario,
            nombreAnterior: usuario.nombre,
            emailAnterior: usuario.email,
            nombreNuevo: credencial.nombre,
            emailNuevo: credencial.email,
            passwordNuevo: credencial.password,
            rol: credencial.tipoUsuario
          });
        }
      }
    }
    
    res.json({
      message: '✅ Credenciales actualizadas exitosamente',
      updates: updates,
      totalActualizados: updates.length
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error actualizando credenciales',
      details: error.message
    });
  }
});

// Endpoint para verificar estructura de tablas relacionadas
app.get('/api/verificar-estructura-tablas', async (req, res) => {
  try {
    // Verificar qué tablas existen para roles específicos
    const tablesInfo = {};
    
    // 1. Estructura de usuarios (tabla principal)
    const [usuariosSchema] = await db.query('DESCRIBE usuarios');
    tablesInfo.usuarios = {
      schema: usuariosSchema,
      count: (await db.query('SELECT COUNT(*) as total FROM usuarios'))[0][0].total
    };
    
    // 2. Verificar tabla alumnos
    try {
      const [alumnosSchema] = await db.query('DESCRIBE alumnos');
      tablesInfo.alumnos = {
        schema: alumnosSchema,
        count: (await db.query('SELECT COUNT(*) as total FROM alumnos'))[0][0].total,
        exists: true
      };
    } catch (e) {
      tablesInfo.alumnos = { exists: false, error: e.message };
    }
    
    // 3. Verificar tabla tutores (no tutor)
    try {
      const [tutoresSchema] = await db.query('DESCRIBE tutores');
      tablesInfo.tutores = {
        schema: tutoresSchema,
        count: (await db.query('SELECT COUNT(*) as total FROM tutores'))[0][0].total,
        exists: true
      };
    } catch (e) {
      tablesInfo.tutores = { exists: false, error: e.message };
    }
    
    // 4. Verificar tabla profesores
    try {
      const [profesoresSchema] = await db.query('DESCRIBE profesores');
      tablesInfo.profesores = {
        schema: profesoresSchema,
        count: (await db.query('SELECT COUNT(*) as total FROM profesores'))[0][0].total,
        exists: true
      };
    } catch (e) {
      tablesInfo.profesores = { exists: false, error: e.message };
    }
    
    // 5. Verificar tabla tutor (la que existe actualmente)
    try {
      const [tutorSchema] = await db.query('DESCRIBE tutor');
      tablesInfo.tutor = {
        schema: tutorSchema,
        count: (await db.query('SELECT COUNT(*) as total FROM tutor'))[0][0].total,
        exists: true
      };
    } catch (e) {
      tablesInfo.tutor = { exists: false, error: e.message };
    }
    
    // 6. Contar usuarios por tipo
    const [usuariosPorTipo] = await db.query(`
      SELECT tipo_usuario, COUNT(*) as total 
      FROM usuarios 
      GROUP BY tipo_usuario
    `);
    
    res.json({
      message: 'Verificación de estructura de tablas',
      tablesInfo: tablesInfo,
      usuariosPorTipo: usuariosPorTipo,
      recomendaciones: {
        necesitaTablasProfesores: !tablesInfo.profesores?.exists,
        necesitaTablaTutores: !tablesInfo.tutores?.exists,
        tieneTablaAlumnos: tablesInfo.alumnos?.exists,
        usandoTablaTutorEnVezDeTutores: tablesInfo.tutor?.exists && !tablesInfo.tutores?.exists
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error verificando estructura',
      details: error.message
    });
  }
});

// Endpoint para crear tablas faltantes con estructura correcta
app.post('/api/crear-tablas-estructura', async (req, res) => {
  try {
    const results = {
      tablasCreadas: [],
      errores: []
    };
    
    // 1. Crear tabla profesores si no existe
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS profesores (
          idProfesor INT PRIMARY KEY AUTO_INCREMENT,
          idUsuario INT NOT NULL,
          especialidad VARCHAR(100),
          titulo VARCHAR(100),
          experiencia_anos INT DEFAULT 0,
          salario DECIMAL(10,2),
          fecha_contratacion DATE,
          materias_imparte TEXT,
          horario_trabajo VARCHAR(50),
          INDEX idx_profesor_usuario (idUsuario),
          FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
        )
      `);
      results.tablasCreadas.push('profesores');
    } catch (e) {
      results.errores.push({ tabla: 'profesores', error: e.message });
    }
    
    // 2. Crear tabla tutores si no existe (diferente de tutor)
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS tutores (
          idTutor INT PRIMARY KEY AUTO_INCREMENT,
          idUsuario INT NOT NULL,
          parentesco VARCHAR(50),
          ocupacion VARCHAR(100),
          lugar_trabajo VARCHAR(100),
          telefono_trabajo VARCHAR(15),
          contacto_emergencia VARCHAR(100),
          telefono_emergencia VARCHAR(15),
          autoriza_recoger BOOLEAN DEFAULT TRUE,
          INDEX idx_tutor_usuario (idUsuario),
          FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
        )
      `);
      results.tablasCreadas.push('tutores');
    } catch (e) {
      results.errores.push({ tabla: 'tutores', error: e.message });
    }
    
    // 3. Verificar/ajustar tabla alumnos existente
    try {
      // Agregar campos adicionales a alumnos si no existen
      const camposAdicionales = [
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS lugar_nacimiento VARCHAR(100)',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS curp VARCHAR(18)',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS seguro_medico VARCHAR(100)',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS alergias TEXT',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS medicamentos TEXT',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(100)',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS telefono_emergencia VARCHAR(15)',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS fecha_ingreso DATE DEFAULT (CURRENT_DATE)',
        'ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS estatus ENUM("activo", "inactivo", "egresado") DEFAULT "activo"'
      ];
      
      for (const sql of camposAdicionales) {
        try {
          await db.query(sql);
        } catch (e) {
          // Ignorar errores de "ya existe" en MySQL
          if (!e.message.includes('Duplicate column name')) {
            throw e;
          }
        }
      }
      results.tablasCreadas.push('alumnos (campos adicionales)');
    } catch (e) {
      results.errores.push({ tabla: 'alumnos', error: e.message });
    }
    
    res.json({
      message: '🏢 Estructura de tablas actualizada',
      results: results,
      resumen: {
        tablasCreadas: results.tablasCreadas.length,
        errores: results.errores.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error creando estructura de tablas',
      details: error.message
    });
  }
});

// Endpoint para ajustar estructura de tablas según necesidades específicas
app.post('/api/ajustar-estructura-tablas', async (req, res) => {
  try {
    const results = {
      ajustesRealizados: [],
      errores: []
    };
    
    // 1. Agregar CURP a tabla usuarios
    try {
      await db.query(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS curp VARCHAR(18) UNIQUE
      `);
      results.ajustesRealizados.push('usuarios: agregado campo CURP');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        results.errores.push({ tabla: 'usuarios', campo: 'curp', error: e.message });
      }
    }
    
    // 2. Eliminar tabla profesores existente y crear nueva con estructura correcta
    try {
      await db.query('DROP TABLE IF EXISTS profesores');
      results.ajustesRealizados.push('profesores: tabla anterior eliminada');
    } catch (e) {
      results.errores.push({ tabla: 'profesores', accion: 'eliminar', error: e.message });
    }
    
    // 3. Crear nueva tabla profesores con estructura correcta
    try {
      await db.query(`
        CREATE TABLE profesores (
          idProfesor INT PRIMARY KEY AUTO_INCREMENT,
          idUsuario INT NOT NULL,
          especialidad VARCHAR(100),
          titulo VARCHAR(100),
          fecha_contratacion DATE,
          materia VARCHAR(100) NOT NULL,
          semestre VARCHAR(20) NOT NULL,
          INDEX idx_profesor_usuario (idUsuario),
          FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
        )
      `);
      results.ajustesRealizados.push('profesores: tabla recreada con materia y semestre');
    } catch (e) {
      results.errores.push({ tabla: 'profesores', accion: 'crear', error: e.message });
    }
    
    // 4. Poblar tabla profesores con usuarios existentes tipo 'profesor'
    try {
      const [usuariosProfesores] = await db.query(`
        SELECT idUsuario, nombre FROM usuarios WHERE tipo_usuario = 'profesor'
      `);
      
      for (const profesor of usuariosProfesores) {
        await db.query(`
          INSERT INTO profesores (idUsuario, especialidad, titulo, materia, semestre)
          VALUES (?, 'Educación', 'Licenciatura', 'Matemáticas', '1er Semestre')
        `, [profesor.idUsuario]);
      }
      
      results.ajustesRealizados.push(`profesores: ${usuariosProfesores.length} registros de profesores creados`);
    } catch (e) {
      results.errores.push({ tabla: 'profesores', accion: 'poblar', error: e.message });
    }
    
    // 5. Poblar tabla tutores con usuarios existentes tipo 'tutor'
    try {
      const [usuariosTutores] = await db.query(`
        SELECT u.idUsuario, u.nombre FROM usuarios u
        LEFT JOIN tutores t ON u.idUsuario = t.idUsuario
        WHERE u.tipo_usuario = 'tutor' AND t.idUsuario IS NULL
      `);
      
      for (const tutor of usuariosTutores) {
        await db.query(`
          INSERT INTO tutores (idUsuario, parentesco, ocupacion)
          VALUES (?, 'Padre/Madre', 'No especificado')
        `, [tutor.idUsuario]);
      }
      
      results.ajustesRealizados.push(`tutores: ${usuariosTutores.length} registros de tutores creados`);
    } catch (e) {
      results.errores.push({ tabla: 'tutores', accion: 'poblar', error: e.message });
    }
    
    res.json({
      message: '⚙️ Estructura ajustada según especificaciones',
      results: results,
      resumen: {
        ajustesRealizados: results.ajustesRealizados.length,
        errores: results.errores.length
      },
      nuevaEstructura: {
        usuarios: 'Agregado campo CURP',
        profesores: {
          campos: ['idProfesor', 'idUsuario', 'especialidad', 'titulo', 'fecha_contratacion', 'materia', 'semestre'],
          eliminados: ['experiencia_anos', 'salario', 'materias_imparte', 'horario_trabajo']
        },
        tutores: 'Poblada con usuarios existentes'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error ajustando estructura de tablas',
      details: error.message
    });
  }
});

// Endpoint para aplicar cambios con SQL directo
app.post('/api/aplicar-cambios-sql', async (req, res) => {
  try {
    const cambios = [];
    const errores = [];
    
    // 1. Verificar conexión y base de datos actual
    const [dbInfo] = await db.query('SELECT DATABASE() as current_db');
    cambios.push(`Conectado a base de datos: ${dbInfo[0].current_db}`);
    
    // 2. Agregar CURP a usuarios - SQL compatible con MySQL 5.x
    try {
      // Primero verificar si la columna ya existe
      const [columnExists] = await db.query(`
        SELECT COUNT(*) as existe 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME = 'curp'
      `);
      
      if (columnExists[0].existe === 0) {
        await db.query('ALTER TABLE usuarios ADD COLUMN curp VARCHAR(18)');
        await db.query('ALTER TABLE usuarios ADD UNIQUE INDEX idx_curp (curp)');
        cambios.push('✅ Campo CURP agregado a tabla usuarios');
      } else {
        cambios.push('ℹ️ Campo CURP ya existe en tabla usuarios');
      }
    } catch (e) {
      errores.push({ accion: 'agregar CURP', error: e.message });
    }
    
    // 3. Eliminar y recrear tabla profesores
    try {
      await db.query('DROP TABLE IF EXISTS profesores');
      cambios.push('✅ Tabla profesores anterior eliminada');
      
      await db.query(`
        CREATE TABLE profesores (
          idProfesor INT AUTO_INCREMENT PRIMARY KEY,
          idUsuario INT NOT NULL,
          especialidad VARCHAR(100),
          titulo VARCHAR(100),
          fecha_contratacion DATE,
          materia VARCHAR(100) NOT NULL DEFAULT 'Sin asignar',
          semestre VARCHAR(20) NOT NULL DEFAULT '1er Semestre',
          FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
      cambios.push('✅ Nueva tabla profesores creada');
    } catch (e) {
      errores.push({ accion: 'recrear tabla profesores', error: e.message });
    }
    
    // 4. Poblar tabla profesores
    try {
      const [profesoresUsuarios] = await db.query(`
        SELECT idUsuario, nombre FROM usuarios WHERE tipo_usuario = 'profesor'
      `);
      
      let profesoresCreados = 0;
      for (const profesor of profesoresUsuarios) {
        await db.query(`
          INSERT INTO profesores (idUsuario, especialidad, titulo, materia, semestre)
          VALUES (?, 'Educación General', 'Licenciatura en Educación', 'Matemáticas', '1er Semestre')
        `, [profesor.idUsuario]);
        profesoresCreados++;
      }
      
      cambios.push(`✅ ${profesoresCreados} registros de profesores creados`);
    } catch (e) {
      errores.push({ accion: 'poblar profesores', error: e.message });
    }
    
    // 5. Verificar o crear tabla tutores
    try {
      const [tutoresTableExists] = await db.query(`
        SELECT COUNT(*) as existe 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tutores'
      `);
      
      if (tutoresTableExists[0].existe === 0) {
        await db.query(`
          CREATE TABLE tutores (
            idTutor INT AUTO_INCREMENT PRIMARY KEY,
            idUsuario INT NOT NULL,
            parentesco VARCHAR(50) DEFAULT 'Padre/Madre',
            ocupacion VARCHAR(100) DEFAULT 'No especificado',
            lugar_trabajo VARCHAR(100),
            telefono_trabajo VARCHAR(15),
            contacto_emergencia VARCHAR(100),
            telefono_emergencia VARCHAR(15),
            autoriza_recoger BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
          ) ENGINE=InnoDB
        `);
        cambios.push('✅ Tabla tutores creada');
      }
      
      // Poblar tabla tutores
      const [tutoresUsuarios] = await db.query(`
        SELECT u.idUsuario, u.nombre FROM usuarios u
        LEFT JOIN tutores t ON u.idUsuario = t.idUsuario
        WHERE u.tipo_usuario = 'tutor' AND t.idUsuario IS NULL
      `);
      
      let tutoresCreados = 0;
      for (const tutor of tutoresUsuarios) {
        await db.query(`
          INSERT INTO tutores (idUsuario, parentesco, ocupacion)
          VALUES (?, 'Padre/Madre', 'No especificado')
        `, [tutor.idUsuario]);
        tutoresCreados++;
      }
      
      cambios.push(`✅ ${tutoresCreados} registros de tutores creados`);
    } catch (e) {
      errores.push({ accion: 'tabla tutores', error: e.message });
    }
    
    // 6. Verificación final
    const verificacion = {};
    try {
      const [usuariosCount] = await db.query('SELECT COUNT(*) as total FROM usuarios');
      verificacion.usuarios = usuariosCount[0].total;
      
      const [profesoresCount] = await db.query('SELECT COUNT(*) as total FROM profesores');
      verificacion.profesores = profesoresCount[0].total;
      
      const [tutoresCount] = await db.query('SELECT COUNT(*) as total FROM tutores');
      verificacion.tutores = tutoresCount[0].total;
      
      const [alumnosCount] = await db.query('SELECT COUNT(*) as total FROM alumnos');
      verificacion.alumnos = alumnosCount[0].total;
    } catch (e) {
      errores.push({ accion: 'verificación', error: e.message });
    }
    
    res.json({
      message: '🔧 Cambios aplicados directamente en MySQL',
      baseDatos: dbInfo[0].current_db,
      cambiosRealizados: cambios,
      errores: errores,
      verificacion: verificacion,
      resumen: {
        cambiosExitosos: cambios.length,
        erroresEncontrados: errores.length,
        estado: errores.length === 0 ? 'EXITOSO' : 'CON ERRORES'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: '🚨 Error aplicando cambios',
      details: error.message,
      stack: error.stack
    });
  }
});

// Endpoint para corregir estructura de tabla tutor (no tutores)
app.post('/api/corregir-tabla-tutor', async (req, res) => {
  try {
    const cambios = [];
    const errores = [];
    
    // 1. Verificar conexión y mostrar estructura actual
    const [dbInfo] = await db.query('SELECT DATABASE() as current_db');
    cambios.push(`Base de datos: ${dbInfo[0].current_db}`);
    
    // 2. Mostrar estructura actual de tabla tutor
    try {
      const [tutorSchema] = await db.query('DESCRIBE tutor');
      cambios.push('Estructura actual de tabla tutor (correcta):');
      tutorSchema.forEach(col => {
        cambios.push(`  - ${col.Field}: ${col.Type}`);
      });
    } catch (e) {
      errores.push({ tabla: 'tutor', error: 'No existe la tabla tutor' });
    }
    
    // 3. Eliminar tabla tutores (plural) duplicada
    try {
      const [tutoresExists] = await db.query(`
        SELECT COUNT(*) as existe 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tutores'
      `);
      
      if (tutoresExists[0].existe > 0) {
        await db.query('DROP TABLE tutores');
        cambios.push('❌ Tabla tutores (duplicada) eliminada');
      } else {
        cambios.push('ℹ️ Tabla tutores ya no existe (correcto)');
      }
    } catch (e) {
      errores.push({ accion: 'eliminar tutores', error: e.message });
    }
    
    // 4. Agregar campos adicionales a tabla tutor (la correcta)
    const camposAgregar = [
      { campo: 'parentesco', tipo: 'VARCHAR(50)', defecto: '\'Padre/Madre\'' },
      { campo: 'ocupacion', tipo: 'VARCHAR(100)', defecto: '\'No especificado\'' },
      { campo: 'lugar_trabajo', tipo: 'VARCHAR(100)', defecto: 'NULL' },
      { campo: 'telefono_trabajo', tipo: 'VARCHAR(15)', defecto: 'NULL' },
      { campo: 'contacto_emergencia', tipo: 'VARCHAR(100)', defecto: 'NULL' },
      { campo: 'telefono_emergencia', tipo: 'VARCHAR(15)', defecto: 'NULL' },
      { campo: 'autoriza_recoger', tipo: 'BOOLEAN', defecto: 'TRUE' }
    ];
    
    for (const campo of camposAgregar) {
      try {
        // Verificar si el campo ya existe
        const [fieldExists] = await db.query(`
          SELECT COUNT(*) as existe 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'tutor' 
          AND COLUMN_NAME = ?
        `, [campo.campo]);
        
        if (fieldExists[0].existe === 0) {
          await db.query(`
            ALTER TABLE tutor 
            ADD COLUMN ${campo.campo} ${campo.tipo} DEFAULT ${campo.defecto}
          `);
          cambios.push(`✅ Campo ${campo.campo} agregado a tabla tutor`);
        } else {
          cambios.push(`ℹ️ Campo ${campo.campo} ya existe en tabla tutor`);
        }
      } catch (e) {
        errores.push({ campo: campo.campo, error: e.message });
      }
    }
    
    // 5. Mostrar estructura final de tabla tutor
    try {
      const [tutorSchemaFinal] = await db.query('DESCRIBE tutor');
      cambios.push('\n🏢 Estructura FINAL de tabla tutor:');
      tutorSchemaFinal.forEach(col => {
        cambios.push(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
    } catch (e) {
      errores.push({ accion: 'mostrar estructura final', error: e.message });
    }
    
    // 6. Contar registros en tabla tutor
    try {
      const [tutorCount] = await db.query('SELECT COUNT(*) as total FROM tutor');
      cambios.push(`\n📈 Total de registros en tabla tutor: ${tutorCount[0].total}`);
      
      // Mostrar algunos registros de ejemplo
      const [ejemplos] = await db.query('SELECT idTutor, idUsuario, idAlumno, parentesco FROM tutor LIMIT 3');
      ejemplos.forEach(ej => {
        cambios.push(`  Tutor ${ej.idTutor}: Usuario ${ej.idUsuario} -> Alumno ${ej.idAlumno} (${ej.parentesco || 'sin parentesco'})`);
      });
    } catch (e) {
      errores.push({ accion: 'contar registros', error: e.message });
    }
    
    res.json({
      message: '🔧 Tabla tutor corregida (eliminada tabla duplicada tutores)',
      cambiosRealizados: cambios,
      errores: errores,
      resumen: {
        tablaTutorCorrecta: 'tabla tutor (singular) - maneja relación alumno-tutor',
        tablaEliminada: 'tabla tutores (plural) - era duplicada',
        camposAgregados: 'parentesco, ocupación, contactos de emergencia',
        estado: errores.length === 0 ? 'EXITOSO' : 'CON ERRORES'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: '🚨 Error corrigiendo tabla tutor',
      details: error.message
    });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Base de datos: controlescolar`);
});

module.exports = app;