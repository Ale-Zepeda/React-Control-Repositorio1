const mysql = require('mysql2/promise');
const db = require('../config/db');

class Alumno {
  constructor(data) {
    this.idAlumnos = data.idAlumnos;
    this.idUsuario = data.idUsuario;
    this.idGrupo = data.idGrupo;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM Alumnos WHERE idAlumnos = ?', [id]);
    return rows.length ? new Alumno(rows[0]) : null;
  }

  static async findByUsuarioId(usuarioId) {
    const [rows] = await db.query('SELECT * FROM Alumnos WHERE idUsuario = ?', [usuarioId]);
    return rows.length ? new Alumno(rows[0]) : null;
  }

  async save() {
    if (this.idAlumnos) {
      // Actualizar alumno existente
      const result = await db.query(
        'UPDATE Alumnos SET idGrupo = ? WHERE idAlumnos = ?',
        [this.idGrupo, this.idAlumnos]
      );
      return result;
    } else {
      // Crear nuevo alumno
      const result = await db.query(
        'INSERT INTO Alumnos (idUsuario, idGrupo) VALUES (?, ?)',
        [this.idUsuario, this.idGrupo]
      );
      this.idAlumnos = result.insertId;
      return result;
    }
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT a.*, u.nombre, u.email, g.grado, g.turno 
      FROM Alumnos a 
      JOIN Usuarios u ON a.idUsuario = u.idUsuario 
      JOIN Grupo g ON a.idGrupo = g.idGrupo
    `);
    return rows;
  }

  async delete() {
    if (!this.idAlumnos) throw new Error('Cannot delete unsaved student');
    return await db.query('DELETE FROM Alumnos WHERE idAlumnos = ?', [this.idAlumnos]);
  }
}

module.exports = Alumno;