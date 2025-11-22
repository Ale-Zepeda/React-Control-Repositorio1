const Usuario = require('../models/Usuario');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class ProfesorController {
  async getAll(req, res) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          p.idProfesor,
          u.nombre,
          u.Ap,
          u.Am,
          u.email,
          u.telefono,
          GROUP_CONCAT(m.nombre) as materias
        FROM profesores p
        INNER JOIN usuarios u ON p.idUsuario = u.idUsuario
        LEFT JOIN materia_profesor pm ON p.idProfesor = pm.idProfesor
        LEFT JOIN materia m ON pm.idMateria = m.idMateria
        GROUP BY p.idProfesor
        ORDER BY u.nombre, u.Ap, u.Am
      `);

      res.json(rows);
    } catch (error) {
      console.error('Error al obtener profesores:', error);
      res.status(500).json({ error: 'Error al obtener la lista de profesores' });
    }
  }
  async create(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Crear el usuario (nivel 2 para profesores)
      const userData = { ...req.body };
      
      // Hash del password
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Obtener el ID del rol profesor
      const [rolRows] = await connection.query('SELECT idRol FROM roles WHERE nombre = ?', ['profesor']);
      if (!rolRows.length) {
        throw new Error('Rol de profesor no encontrado');
      }
      const idRol = rolRows[0].idRol;

      const [userResult] = await connection.query(
        'INSERT INTO usuarios (nombre, Ap, Am, calle, colonia, numero, cp, telefono, email, password, idRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userData.nombre, userData.Ap, userData.Am, userData.calle, userData.colonia, userData.numero, userData.cp, userData.telefono, userData.email, userData.password, idRol]
      );

      // 2. Crear el registro en la tabla profesores
      const [profResult] = await connection.query(
        'INSERT INTO profesores (idUsuario) VALUES (?)',
        [userResult.insertId]
      );

      // 3. Si hay materias seleccionadas, crear las asignaciones
      if (req.body.materiasSeleccionadas && req.body.materiasSeleccionadas.length > 0) {
        const values = req.body.materiasSeleccionadas.map(idMateria => [profResult.insertId, idMateria]);
        await connection.query(
          'INSERT INTO materia_profesor (idProfesor, idMateria) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      
      res.status(201).json({
        message: 'Profesor creado exitosamente',
        idUsuario: userResult.insertId,
        idProfesor: profResult.insertId
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error al crear profesor:', error);
      res.status(500).json({ 
        error: 'Error al crear profesor', 
        details: error.message 
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = new ProfesorController();