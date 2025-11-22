const db = require('../config/db');

class Tutor {
  constructor(data) {
    this.idTutor = data.idTutor;
    this.idUsuario = data.idUsuario;
    this.idAlumno = data.idAlumno;
  }

    static async findByUsuarioId(usuarioId) {
    const [rows] = await db.query(
      'SELECT t.*, a.idUsuario as alumnoUsuarioId, u.nombre as alumnoNombre FROM Tutor t ' +
      'JOIN Alumnos a ON t.idAlumno = a.idAlumnos ' +
      'JOIN Usuarios u ON a.idUsuario = u.idUsuario ' +
      'WHERE t.idUsuario = ?',
      [usuarioId]
    );
    return rows.map(row => ({
      ...new Tutor(row),
      alumnoUsuarioId: row.alumnoUsuarioId,
      alumnoNombre: row.alumnoNombre
    }));
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM Tutor WHERE idTutor = ?', [id]);
    return rows.length ? new Tutor(rows[0]) : null;
  }

  async save() {
    if (this.idTutor) {
      const result = await db.query(
        'UPDATE Tutor SET idAlumno = ? WHERE idTutor = ?',
        [this.idAlumno, this.idTutor]
      );
      return result;
    } else {
      const result = await db.query(
        'INSERT INTO Tutor (idUsuario, idAlumnos) VALUES (?, ?)',
        [this.idUsuario, this.idAlumno]
      );
      this.idTutor = result.insertId;
      return result;
    }
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT t.*, 
             u.nombre as tutorNombre, 
             u.email as tutorEmail,
             a.idUsuario as alumnoUsuarioId,
             ua.nombre as alumnoNombre
      FROM Tutor t
      JOIN Usuarios u ON t.idUsuario = u.idUsuario
      JOIN Alumnos a ON t.idAlumno = a.idAlumnos
      JOIN Usuarios ua ON a.idUsuario = ua.idUsuario
    `);
    return rows;
  }

  static async getAlumnosByTutor(tutorId) {
    const [rows] = await db.query(`
      SELECT a.*, u.nombre, u.email 
      FROM Alumnos a
      JOIN Tutor t ON a.idAlumnos = t.idAlumno
      JOIN Usuarios u ON a.idUsuario = u.idUsuario
      WHERE t.idUsuario = ?
    `, [tutorId]);
    return rows;
  }

  async delete() {
    if (!this.idTutor) throw new Error('Cannot delete unsaved tutor');
    return await db.query('DELETE FROM Tutor WHERE idTutor = ?', [this.idTutor]);
  }
}

module.exports = Tutor;