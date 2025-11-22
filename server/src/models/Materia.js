const db = require('../config/db');

class Materia {
    constructor(data) {
        this.idMateria = data.idMateria;
        this.nombre = data.nombre;
        this.semestre = data.semestre;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM Materia WHERE idMateria = ?', [id]);
        return rows.length ? new Materia(rows[0]) : null;
    }

    static async getAll() {
        const [rows] = await db.query('SELECT * FROM Materia');
        return rows.map(row => new Materia(row));
    }

    static async getByProfesor(profesorId) {
        const [rows] = await db.query(`
            SELECT m.*, p.turno, p.idProfesor
            FROM Materia m
            JOIN Profesores p ON m.idMateria = p.idMateria
            WHERE p.idUsuarioProfesor = ?
        `, [profesorId]);
        return rows;
    }

    static async getByGrupo(grupoId) {
        const [rows] = await db.query(`
            SELECT m.*, g.grado, g.turno
            FROM Materia m
            JOIN GrupoMateria gm ON m.idMateria = gm.idMateria
            JOIN Grupo g ON gm.idGrupo = g.idGrupo
            WHERE g.idGrupo = ?
        `, [grupoId]);
        return rows;
    }

    async save() {
        if (this.idMateria) {
            const result = await db.query(
                'UPDATE Materia SET nombre = ?, semestre = ? WHERE idMateria = ?',
                [this.nombre, this.semestre, this.idMateria]
            );
            return result;
        } else {
            const result = await db.query(
                'INSERT INTO Materia (nombre, semestre) VALUES (?, ?)',
                [this.nombre, this.semestre]
            );
            this.idMateria = result.insertId;
            return result;
        }
    }

    async delete() {
        if (!this.idMateria) throw new Error('Cannot delete unsaved subject');
        return await db.query('DELETE FROM Materia WHERE idMateria = ?', [this.idMateria]);
    }
}

module.exports = Materia;