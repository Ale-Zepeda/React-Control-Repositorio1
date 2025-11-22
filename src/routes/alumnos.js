const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Corrige la ruta de importación

// GET - Obtener todos los alumnos (enriquecido con datos de usuario y grupo)
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      a.idAlumnos,
      u.nombre,
      u.Ap,
      u.Am,
      CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,''), ' ', u.nombre) AS nombreCompleto,
      CONCAT('ALU', LPAD(a.idAlumnos, 4, '0')) AS matricula,
      g.especialidad,
      g.turno,
      g.semestre,
      u.calle, u.colonia, u.numero, u.cp,
      u.telefono,
      u.email
    FROM alumnos a
    JOIN usuarios u ON u.idUsuario = a.idUsuario
    LEFT JOIN grupo g ON g.idGrupo = a.idGrupo
    WHERE u.tipo_usuario = 'alumno'
    ORDER BY u.Ap, u.Am, u.nombre
  `;
  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST - Alta completa alumno+tutor (transaccional)
router.post('/alta-completa', async (req, res) => {
  const { alumnoUsuario = {}, alumno = {}, tutor = {} } = req.body || {};
  
  // Validación de campos requeridos
  const camposRequeridos = ['nombre', 'email', 'Ap', 'Am', 'genero', 'curp'];
  const camposFaltantes = camposRequeridos.filter(campo => !alumnoUsuario[campo]);
  
  if (camposFaltantes.length > 0) {
    return res.status(400).json({ 
      error: `Por favor complete los siguientes campos obligatorios: ${camposFaltantes.join(', ')}`
    });
  }

  // Validación del formato de CURP
  const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
  if (!curpRegex.test(alumnoUsuario.curp)) {
    return res.status(400).json({
      error: 'El formato de la CURP no es válido. Debe contener 18 caracteres en el formato correcto.'
    });
  }

  // Validación de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(alumnoUsuario.email)) {
    return res.status(400).json({
      error: 'El formato del email no es válido'
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Validar y convertir campos numéricos
    let telefono;
    let cp;

    // Validar teléfono (campo NOT NULL)
    if (!alumnoUsuario.telefono) {
      throw new Error('El teléfono es obligatorio');
    }
    if (!/^\d{10}$/.test(alumnoUsuario.telefono)) {
      throw new Error('El teléfono debe contener exactamente 10 dígitos');
    }
    telefono = BigInt(alumnoUsuario.telefono);

    // Validar código postal (campo NOT NULL)
    if (!alumnoUsuario.cp) {
      throw new Error('El código postal es obligatorio');
    }
    if (!/^\d{5}$/.test(alumnoUsuario.cp)) {
      throw new Error('El código postal debe contener exactamente 5 dígitos');
    }
    cp = parseInt(alumnoUsuario.cp);

    const alumnoPayload = {
      nombre: alumnoUsuario.nombre,
      Ap: alumnoUsuario.Ap,
      Am: alumnoUsuario.Am,
      calle: alumnoUsuario.calle,
      colonia: alumnoUsuario.colonia,
      numero: alumnoUsuario.numero,
      cp: cp,
      telefono: telefono.toString(), // Convertir el BigInt a string para la inserción
      email: alumnoUsuario.email,
      password: alumnoUsuario.password || 'alumno123',
      idNivel: 3, // Nivel para alumnos
      tipo_usuario: 'alumno',
      genero: alumnoUsuario.genero,
      curp: alumnoUsuario.curp
    }
    const [insU] = await conn.query('INSERT INTO usuarios SET ?', alumnoPayload);
    const idUsuarioAlumno = insU.insertId;

    // Buscar o crear el grupo correspondiente
    const [grupoExistente] = await conn.query(
      'SELECT idGrupo FROM grupo WHERE especialidad = ? AND semestre = ? AND turno = ?',
      [alumno.especialidad, alumno.semestre, alumno.turno]
    );

    let idGrupo;
    if (grupoExistente.length > 0) {
      idGrupo = grupoExistente[0].idGrupo;
    } else {
      // Crear nuevo grupo si no existe
      const [nuevoGrupo] = await conn.query(
        'INSERT INTO grupo (especialidad, semestre, turno) VALUES (?, ?, ?)',
        [alumno.especialidad, alumno.semestre, alumno.turno]
      );
      idGrupo = nuevoGrupo.insertId;
    }
    
    // Crear registro de alumno
    const [insA] = await conn.query(
      'INSERT INTO alumnos (idUsuario, idGrupo) VALUES (?, ?)',
      [idUsuarioAlumno, idGrupo]
    );
    const idAlumno = insA.insertId;

    let idUsuarioTutor = null;
    
    // Validar que venga información del tutor
    if (!tutor) {
      throw new Error('Es obligatorio proporcionar un tutor');
    }

    // Procesar datos del tutor
    if (tutor.email) {
      // Buscar tutor existente
      const [tutores] = await conn.query(
        'SELECT idUsuario FROM usuarios WHERE email = ? AND tipo_usuario = "tutor" LIMIT 1', 
        [tutor.email]
      );
      if (tutores.length === 0) {
        throw new Error('No se encontró ningún tutor con el email proporcionado');
      }
      idUsuarioTutor = tutores[0].idUsuario;
      console.log('Tutor existente encontrado:', idUsuarioTutor);
    } else if (tutor.usuario) {
        // Crear nuevo tutor
        const tu = tutor.usuario;
        // Validar campos requeridos del tutor
        const camposRequeridosTutor = ['nombre', 'Ap', 'Am', 'email'];
        const faltantesTutor = camposRequeridosTutor.filter(campo => !tu[campo]);
        
        if (faltantesTutor.length > 0) {
          throw new Error(`Faltan datos obligatorios del tutor: ${faltantesTutor.join(', ')}`);
        }
        
        // Validar email del tutor
        if (!emailRegex.test(tu.email)) {
          throw new Error('El formato del email del tutor no es válido');
        }
        
        const tutorPayload = {
          nombre: tu.nombre,
          Ap: tu.Ap,
          Am: tu.Am,
          calle: tu.calle ?? '',
          colonia: tu.colonia ?? '',
          numero: tu.numero ?? '',
          cp: tu.cp || '',
          telefono: tu.telefono || null,
          email: tu.email,
          password: tu.password || 'tutor123',
          idNivel: 3,
          tipo_usuario: 'tutor'
        };
        
        const [insT] = await conn.query('INSERT INTO usuarios SET ?', tutorPayload);
        idUsuarioTutor = insT.insertId;
      }
      
      // Vincular tutor con alumno
      if (!idUsuarioTutor) {
        throw new Error('No se pudo obtener el ID del tutor');
      }

      try {
        await conn.query(
          'INSERT INTO tutor (idUsuario, idAlumnos) VALUES (?, ?)',
          [idUsuarioTutor, idAlumno]
        );
        console.log('Tutor vinculado correctamente');
      } catch (e) {
        throw new Error('Error al vincular el tutor con el alumno: ' + e.message);
      }

    await conn.commit();
    return res.status(201).json({ 
      idAlumno, 
      idUsuarioAlumno, 
      idUsuarioTutor 
    });
  } catch (e) {
    console.error('Error en alta de alumno:', e);
    try {
      await conn.rollback();
    } catch (rollbackError) {
      console.error('Error en rollback:', rollbackError);
    }
    return res.status(500).json({ error: e.message });
  } finally {
    try {
      await conn.release();
    } catch (closeError) {
      console.error('Error cerrando conexión:', closeError);
    }
  }
})

// GET - Obtener alumno por idUsuario (definido antes para evitar colisión con /:id)
router.get('/usuario/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;
  console.log('Buscando alumno para usuario ID:', idUsuario);
  
  const sql = `
    SELECT 
      a.idAlumnos as idAlumno,
      a.idUsuario,
      a.idGrupo,
      u.nombre,
      u.Ap,
      u.Am,
      u.email,
      CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) AS apellido,
      CONCAT('ALU', LPAD(a.idAlumnos, 4, '0')) AS matricula,
      g.grado,
      g.turno
    FROM usuarios u
    LEFT JOIN alumnos a ON u.idUsuario = a.idUsuario
    LEFT JOIN grupo g ON a.idGrupo = g.idGrupo
    WHERE u.idUsuario = ?
    LIMIT 1
  `;
  
  db.query(sql, [idUsuario], (err, results) => {
    if (err) {
      console.error('Error buscando alumno por usuario:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Resultados encontrados:', results);
    
    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Alumno no encontrado para ese usuario',
        details: { searchedId: idUsuario }
      });
    }
    
    res.json(results[0]);
  });
});

// GET - Obtener alumno por ID (por idAlumnos)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      a.idAlumnos,
      a.idUsuario,
      a.idGrupo,
      u.nombre,
      u.Ap,
      u.Am,
      u.email,
      CONCAT(IFNULL(u.Ap,''), ' ', IFNULL(u.Am,'')) AS apellido,
      CONCAT('ALU', LPAD(a.idAlumnos, 4, '0')) AS matricula,
      g.especialidad,
      g.semestre,
      g.turno
    FROM alumnos a
    JOIN usuarios u ON u.idUsuario = a.idUsuario
    LEFT JOIN grupo g ON g.idGrupo = a.idGrupo
    WHERE a.idAlumnos = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json(results[0]);
  });
});

// GET - Calificaciones del alumno
router.get('/:id/calificaciones', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      c.*,
      m.nombre as materia,
      CURDATE() as fecha
    FROM calificaciones c
    LEFT JOIN materia m ON m.idMateria = c.idMateria
    WHERE c.idAlumno = ? 
    ORDER BY c.periodo DESC, m.nombre
  `;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error en calificaciones:', err);
      return res.status(200).json([]); // tolerar estructura distinta
    }
    res.json(results);
  });
});

// GET - Asistencias del alumno
router.get('/:id/asistencias', (req, res) => {
  const { id } = req.params;
  console.log('Buscando asistencias para alumno ID:', id);
  
  // Obtener la fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  console.log('Fecha actual:', today);
  
  // Primero verificamos si existe la tabla
  db.query('SHOW TABLES LIKE "asistenciaqr"', (tableErr, tables) => {
    if (tableErr || tables.length === 0) {
      console.log('La tabla asistenciaqr no existe, creándola...');
      const createTable = `
        CREATE TABLE IF NOT EXISTS asistenciaqr (
          id INT NOT NULL AUTO_INCREMENT,
          idAlumnos INT NOT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_asistencia_alumno (idAlumnos),
          CONSTRAINT fk_asistencia_alumno FOREIGN KEY (idAlumnos) 
          REFERENCES Alumnos(idAlumnos) ON UPDATE CASCADE ON DELETE CASCADE
        )
      `;
      
      db.query(createTable, (createErr) => {
        if (createErr) {
          console.error('Error creando tabla:', createErr);
          return res.status(200).json([]);
        }
        processAsistencias();
      });
    } else {
      processAsistencias();
    }
  });

  function processAsistencias() {
    const sql = `
      SELECT 
        CASE 
          WHEN TIME(createdAt) <= '08:00:00' THEN 'presente'
          WHEN TIME(createdAt) <= '08:30:00' THEN 'tarde'
          ELSE 'ausente'
        END as estado,
        createdAt as fecha,
        TIME(createdAt) as hora,
        CASE 
          WHEN TIME(createdAt) <= '08:00:00' THEN 'Asistencia a tiempo'
          WHEN TIME(createdAt) <= '08:30:00' THEN 'Llegada tarde'
          ELSE 'Ausencia registrada'
        END as observaciones
      FROM asistenciaqr 
      WHERE idAlumnos = ? 
        AND DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY createdAt DESC
    `;

    console.log('Ejecutando consulta de asistencias...');
    
    // Obtenemos las asistencias registradas
    db.query(sql, [id], (err, results) => {
      if (err) {
        console.error('Error en consulta de asistencias:', err);
        return res.status(200).json([]);
      }

      console.log('Asistencias encontradas:', results.length);
      
      // Verificar si hay asistencia para hoy
      const hasToday = results.some(r => {
        const fechaAsistencia = new Date(r.fecha).toISOString().split('T')[0];
        console.log('Comparando fecha:', fechaAsistencia, 'con hoy:', today);
        return fechaAsistencia === today;
      });
      
      // Si no hay asistencia para hoy, agregar un registro de ausencia
      if (!hasToday) {
        console.log('No hay asistencia para hoy, agregando registro pendiente');
        results.unshift({
          estado: 'pendiente',
          fecha: new Date().toISOString(),
          hora: null,
          observaciones: 'Asistencia pendiente del día'
        });
      }

      console.log('Enviando resultados finales:', results.length, 'registros');
      res.json(results);
    });
  }
});

// GET - Talleres del alumno
router.get('/:id/talleres', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT t.*
    FROM Talleres t
    JOIN TalleresAlumnos ta ON ta.idTaller = t.idTaller
    WHERE ta.idAlumnos = ? OR ta.idAlumno = ?
  `;
  db.query(sql, [id, id], (err, results) => {
    if (err) return res.status(200).json([]);
    res.json(results);
  });
});

module.exports = router;
