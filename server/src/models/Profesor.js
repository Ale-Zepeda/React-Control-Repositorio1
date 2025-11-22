const db = require('../config/db');

class Profesor {
  constructor(data) {
    this.idProfesor = data.idProfesor;
    this.idUsuarioProfesor = data.idUsuarioProfesor;
    this.materia = data.materia;
    this.semestre = data.semestre;
    this.turno = data.turno;
  }

  static async findByUsuarioId(usuarioId) {
    const [rows] = await db.query(
      'SELECT * FROM Profesores WHERE idUsuarioProfesor = ?',
      [usuarioId]
    );
    return rows.map(row => new Profesor(row));
  }

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM Profesores WHERE idProfesor = ?',
      [id]
    );
    return rows.length ? new Profesor(rows[0]) : null;
  }

  async save() {
    if (this.idProfesor) {
      const result = await db.query(
        'UPDATE Profesores SET materia = ?, semestre = ?, turno = ? WHERE idProfesor = ?',
        [this.materia, this.semestre, this.turno, this.idProfesor]
      );
      return result;
    } else {
      const result = await db.query(
        'INSERT INTO Profesores (idUsuarioProfesor, materia, semestre, turno) VALUES (?, ?, ?, ?)',
        [this.idUsuarioProfesor, this.materia, this.semestre, this.turno]
      );
      this.idProfesor = result.insertId;
      return result;
    }
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT p.*, u.nombre, u.email 
      FROM Profesores p 
      JOIN Usuarios u ON p.idUsuarioProfesor = u.idUsuario
    `);
    return rows.map(row => new Profesor(row));
  }

  static async getMateriasByProfesor(profesorId) {
    const [rows] = await db.query(
      'SELECT materia FROM Profesores WHERE idUsuarioProfesor = ?',
      [profesorId]
    );
    return rows.map(row => row.materia);
  }

  async delete() {
    if (!this.idProfesor) throw new Error('Cannot delete unsaved professor');
    return await db.query('DELETE FROM Profesores WHERE idProfesor = ?', [this.idProfesor]);
  }
}

module.exports = Profesor;