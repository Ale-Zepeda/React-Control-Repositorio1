const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET - Obtener todos los profesores
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.idUsuario,
        p.idProfesor,
        u.nombre,
        u.Ap,
        u.Am,
        CONCAT(u.nombre, ' ', u.Ap, ' ', u.Am) as nombreCompleto,
        u.email,
        u.telefono,
        u.calle,
        u.colonia,
        u.numero,
        u.cp,
        p.titulo,
        GROUP_CONCAT(DISTINCT m.nombre SEPARATOR ', ') as materias,
        GROUP_CONCAT(DISTINCT m.idMateria SEPARATOR ',') as materiasIds
      FROM usuarios u
      INNER JOIN profesores p ON p.idUsuario = u.idUsuario
      LEFT JOIN materia_profesor mp ON p.idProfesor = mp.idProfesor
      LEFT JOIN materia m ON mp.idMateria = m.idMateria
      WHERE u.idNivel = 2 AND u.tipo_usuario = 'profesor'
      GROUP BY u.idUsuario, p.idProfesor, u.nombre, u.Ap, u.Am, u.email, u.telefono, u.calle, u.colonia, u.numero, u.cp, p.titulo
      ORDER BY u.nombre, u.Ap, u.Am
    `;
    
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error consultando profesores:', err);
    res.status(500).json({ 
      error: 'Error al obtener la lista de profesores',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST - Crear nuevo profesor
router.post('/', async (req, res) => {
  let connection;
  try {
    const { 
      nombre, 
      Ap, 
      Am, 
      email, 
      telefono, 
      password, 
      calle, 
      colonia, 
      numero, 
      cp, 
      curp,
      materia,
      titulo
    } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !Ap || !Am || !email || !telefono || !password || !calle || !colonia || !numero || !cp) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios excepto CURP' });
    }
    
    const usuario = {
      nombre,
      Ap,
      Am,
      email,
      telefono: parseInt(telefono),
      password,
      idNivel: 2,
      tipo_usuario: 'profesor',
      calle,
      colonia,
      numero,
      cp: parseInt(cp),
      curp: curp || null // CURP es opcional
    };

    // Usar la conexión normal del pool en lugar de getConnection
    try {
      // Insertar usuario
      const [result] = await db.query('INSERT INTO usuarios SET ?', [usuario]);
      const userId = result.insertId;
      
      // Crear registro en tabla profesores
      const [profResult] = await db.query('INSERT INTO profesores (idUsuario, titulo) VALUES (?, ?)', [userId, titulo || null]);
      
      // Si se proporcionan materias, crear las relaciones
      if (req.body.materias && Array.isArray(req.body.materias)) {
        for (const idMateria of req.body.materias) {
          await db.query(
            'INSERT INTO materia_profesor (idMateria, idProfesor, idGrupo) VALUES (?, ?, NULL)',
            [idMateria, profResult.insertId]
          );
        }
      }
      
      res.status(201).json({
        id: userId,
        message: 'Profesor creado exitosamente'
      });
    } catch (error) {
      throw error;
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    console.error('Error creando profesor:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar profesor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      Ap, 
      Am, 
      email, 
      telefono, 
      calle, 
      colonia, 
      numero, 
      cp, 
      curp,
      titulo
    } = req.body;

    const updateData = {
      nombre,
      Ap,
      Am,
      email,
      telefono: parseInt(telefono),
      calle,
      colonia,
      numero,
      cp: parseInt(cp),
      curp
    };

    // Si se proporciona una nueva contraseña, la incluimos en la actualización
    if (req.body.password && req.body.password.trim() !== '') {
      updateData.password = req.body.password;
    }
    
    // Actualizar información del usuario
    const [updateResult] = await db.query('UPDATE usuarios SET ? WHERE idUsuario = ?', [updateData, id]);
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    // Actualizar título en tabla profesores
    if (titulo !== undefined) {
      await db.query('UPDATE profesores SET titulo = ? WHERE idUsuario = ?', [titulo, id]);
    }

    // Actualizar materias si se proporcionan
    if (req.body.materias !== undefined) {
      // Primero obtener el idProfesor desde la tabla profesores
      const [profesorResult] = await db.query('SELECT idProfesor FROM profesores WHERE idUsuario = ?', [id]);
      
      if (profesorResult.length > 0) {
        const idProfesor = profesorResult[0].idProfesor;
        
        // Eliminar todas las asignaciones actuales del profesor
        await db.query('DELETE FROM materia_profesor WHERE idProfesor = ?', [idProfesor]);
        
        // Insertar las nuevas materias con idGrupo NULL
        if (Array.isArray(req.body.materias)) {
          for (const idMateria of req.body.materias) {
            await db.query(
              'INSERT INTO materia_profesor (idMateria, idProfesor, idGrupo) VALUES (?, ?, ?)',
              [idMateria, idProfesor, null]
            );
          }
        }
      }
    }
    
    res.json({ message: 'Profesor actualizado exitosamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    console.error('Error actualizando profesor:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener grupos de un profesor
router.get('/:id/grupos', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Buscando grupos para profesor ID:', id);
    
    const sql = `
      SELECT 
        g.idGrupo,
        g.especialidad,
        g.turno,
        g.semestre,
        m.nombre as nombreMateria,
        m.idMateria,
        mp.idProfesor,
        (
          SELECT COUNT(*)
          FROM alumnos a
          WHERE a.idGrupo = g.idGrupo
        ) as totalAlumnos
      FROM materia_profesor mp
      JOIN grupo g ON g.idGrupo = mp.idGrupo
      JOIN materia m ON m.idMateria = mp.idMateria
      JOIN profesores p ON p.idProfesor = mp.idProfesor
      WHERE p.idUsuario = ?
      ORDER BY g.especialidad, g.turno, g.semestre
    `;
    
    const [grupos] = await db.query(sql, [id]);
    console.log('Grupos encontrados:', grupos.length);
    res.json(grupos);
  } catch (err) {
    console.error('Error consultando grupos:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener alumnos de un grupo específico
router.get('/:id/grupos/:grupoId/alumnos', async (req, res) => {
  try {
    const { grupoId } = req.params;
    
    const sql = `
      SELECT 
        a.idAlumnos as idAlumno,
        u.nombre,
        u.Ap,
        u.Am,
        CONCAT(u.Ap, ' ', u.Am) AS apellido,
        CONCAT('ALU', LPAD(a.idAlumnos, 4, '0')) AS matricula,
        a.idGrupo
      FROM alumnos a
      JOIN usuarios u ON u.idUsuario = a.idUsuario
      WHERE a.idGrupo = ?
      ORDER BY u.Ap, u.Am, u.nombre
    `;
    
    const [alumnos] = await db.query(sql, [grupoId]);
    res.json(alumnos);
  } catch (err) {
    console.error('Error consultando alumnos del grupo:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar profesor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Intentando eliminar profesor con ID:', id);
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de profesor no válido' });
    }

    // Verificar si el profesor existe (misma lógica que el GET)
    const [profesorExists] = await db.query(`
      SELECT u.idUsuario 
      FROM usuarios u
      INNER JOIN profesores p ON p.idUsuario = u.idUsuario
      WHERE u.idUsuario = ? AND u.idNivel = 2 AND u.tipo_usuario = 'profesor'
    `, [id]);
    console.log('👤 Profesor encontrado:', profesorExists.length > 0);
    
    if (profesorExists.length === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    // Verificar registros en encargadoregistro
    const [encargadoCheck] = await db.query('SELECT COUNT(*) as count FROM encargadoregistro WHERE idUsuario = ?', [id]);
    console.log('📋 Registros en encargadoregistro:', encargadoCheck[0].count);
    
    if (encargadoCheck[0].count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el profesor porque tiene registros asociados en el sistema. Primero debe eliminar o transferir estos registros.' 
      });
    }

    // Verificar y limpiar asignaciones de materias
    const [materiaProfesorCheck] = await db.query('SELECT COUNT(*) as count FROM materia_profesor mp JOIN profesores p ON mp.idProfesor = p.idProfesor WHERE p.idUsuario = ?', [id]);
    console.log('📚 Asignaciones de materias:', materiaProfesorCheck[0].count);
    
    if (materiaProfesorCheck[0].count > 0) {
      const [deleteMateriasResult] = await db.query('DELETE mp FROM materia_profesor mp JOIN profesores p ON mp.idProfesor = p.idProfesor WHERE p.idUsuario = ?', [id]);
      console.log('🗑️ Asignaciones de materias eliminadas:', deleteMateriasResult.affectedRows);
    }

    // Eliminar el registro de profesores
    const [deleteProfResult] = await db.query('DELETE FROM profesores WHERE idUsuario = ?', [id]);
    console.log('🗑️ Registro de profesores eliminado:', deleteProfResult.affectedRows);
    
    // Finalmente eliminar el usuario
    const [deleteUserResult] = await db.query('DELETE FROM usuarios WHERE idUsuario = ?', [id]);
    console.log('🗑️ Usuario eliminado:', deleteUserResult.affectedRows);
    
    if (deleteUserResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Error: No se pudo eliminar el usuario' });
    }

    console.log('✅ Profesor eliminado exitosamente');
    res.json({ message: 'Profesor eliminado exitosamente' });
  } catch (err) {
    console.error('❌ Error eliminando profesor:', err);
    
    // Manejo específico de errores de clave foránea
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'No se puede eliminar el profesor porque tiene registros asociados en el sistema.' 
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Endpoint temporal para eliminar por nombre (solo para debug)
router.delete('/debug/eliminar-carlos', async (req, res) => {
  try {
    console.log('🔧 DEBUG - Eliminando Carlos Rodríguez Morales directamente');
    
    // Buscar el Carlos profesor (ID 26)
    const [carlosProfesor] = await db.query(`
      SELECT u.idUsuario 
      FROM usuarios u
      INNER JOIN profesores p ON p.idUsuario = u.idUsuario
      WHERE u.nombre = 'Carlos' AND u.Ap = 'Rodríguez' AND u.Am = 'Morales'
      AND u.idNivel = 2 AND u.tipo_usuario = 'profesor'
    `);
    
    if (carlosProfesor.length === 0) {
      return res.status(404).json({ error: 'Carlos profesor no encontrado' });
    }
    
    const idUsuario = carlosProfesor[0].idUsuario;
    console.log('🎯 Carlos profesor encontrado con ID:', idUsuario);
    
    // Limpiar registros relacionados
    await db.query('DELETE FROM encargadoregistro WHERE idUsuario = ?', [idUsuario]);
    await db.query('DELETE FROM materia_profesor WHERE idProfesor IN (SELECT idProfesor FROM profesores WHERE idUsuario = ?)', [idUsuario]);
    
    // Eliminar de tabla profesores
    await db.query('DELETE FROM profesores WHERE idUsuario = ?', [idUsuario]);
    
    // Eliminar usuario
    await db.query('DELETE FROM usuarios WHERE idUsuario = ?', [idUsuario]);
    
    console.log('✅ Carlos profesor eliminado exitosamente');
    res.json({ message: 'Profesor eliminado exitosamente', id: idUsuario });
    
  } catch (err) {
    console.error('❌ Error eliminando Carlos:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;