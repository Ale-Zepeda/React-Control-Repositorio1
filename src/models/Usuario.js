const mysql = require('mysql2/promise');
const db = require('../config/db');

class Usuario {
  constructor(data) {
    this.idUsuario = data.idUsuario;
    this.nombre = data.nombre;
    this.Ap = data.Ap;
    this.Am = data.Am;
    this.calle = data.calle;
    this.colonia = data.colonia;
    this.numero = data.numero;
    this.cp = data.cp;
    this.telefono = data.telefono;
    this.email = data.email;
    this.idNivel = data.idNivel;
    this.password = data.password;
    this.tipo_usuario = data.tipo_usuario || data.rol;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
    return rows.length ? new Usuario(rows[0]) : null;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM Usuarios WHERE idUsuario = ?', [id]);
    return rows.length ? new Usuario(rows[0]) : null;
  }

  async save() {
    if (this.idUsuario) {
      // Actualizar usuario existente
      const result = await db.query(
        'UPDATE Usuarios SET nombre = ?, Ap = ?, Am = ?, calle = ?, colonia = ?, numero = ?, cp = ?, telefono = ?, email = ?, idNivel = ?, password = ?, tipo_usuario = ? WHERE idUsuario = ?',
        [this.nombre, this.Ap, this.Am, this.calle, this.colonia, this.numero, this.cp, this.telefono, this.email, this.idNivel, this.password, this.tipo_usuario, this.idUsuario]
      );
      return result;
    } else {
      // Crear nuevo usuario
      const result = await db.query(
        'INSERT INTO Usuarios (nombre, Ap, Am, calle, colonia, numero, cp, telefono, email, idNivel, password, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [this.nombre, this.Ap, this.Am, this.calle, this.colonia, this.numero, this.cp, this.telefono, this.email, this.idNivel, this.password, this.tipo_usuario]
      );
      this.idUsuario = result.insertId;
      return result;
    }
  }

  static async getAll() {
    const [rows] = await db.query('SELECT * FROM Usuarios');
    return rows.map(row => new Usuario(row));
  }

  async delete() {
    if (!this.idUsuario) throw new Error('Cannot delete unsaved user');
    return await db.query('DELETE FROM Usuarios WHERE idUsuario = ?', [this.idUsuario]);
  }
}

module.exports = Usuario;