const db = require('../config/db');

class Calificacion {
    constructor(data) {
        this.idCalificaciones = data.idCalificaciones;
        this.idMateria = data.idMateria;
        this.idAlumno = data.idAlumno;
        this.calificacion = data.calificacion;
        this.periodo = data.periodo;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM Calificaciones WHERE idCalificaciones = ?', [id]);
        return rows.length ? new Calificacion(rows[0]) : null;
    }

    static async getAll() {
        const [rows] = await db.query(`
            SELECT c.*, m.nombre as materia, 
                   CONCAT(u.nombre, ' ', u.Ap, ' ', u.Am) as alumno
            FROM Calificaciones c
            JOIN Materia m ON c.idMateria = m.idMateria
            JOIN Alumnos a ON c.idAlumno = a.idAlumnos
            JOIN Usuarios u ON a.idUsuario = u.idUsuario
        `);
        return rows;
    }

    static async getByAlumno(alumnoId) {
        const [rows] = await db.query(`
            SELECT c.*, m.nombre as materia, m.semestre
            FROM Calificaciones c
            JOIN Materia m ON c.idMateria = m.idMateria
            WHERE c.idAlumno = ?
            ORDER BY m.semestre, m.nombre
        `, [alumnoId]);
        return rows;
    }

    static async getByMateria(materiaId) {
        const [rows] = await db.query(`
            SELECT c.*, u.nombre as alumno, g.grado, g.turno
            FROM Calificaciones c
            JOIN Alumnos a ON c.idAlumno = a.idAlumnos
            JOIN Usuarios u ON a.idUsuario = u.idUsuario
            JOIN Grupo g ON a.idGrupo = g.idGrupo
            WHERE c.idMateria = ?
            ORDER BY u.nombre
        `, [materiaId]);
        return rows;
    }

    async save() {
        if (this.idCalificaciones) {
            const result = await db.query(
                'UPDATE Calificaciones SET calificacion = ?, periodo = ? WHERE idCalificaciones = ?',
                [this.calificacion, this.periodo, this.idCalificaciones]
            );
            return result;
        } else {
            // Verificar si ya existe una calificación para este alumno, materia y periodo
            const [existing] = await db.query(
                'SELECT idCalificaciones FROM Calificaciones WHERE idAlumno = ? AND idMateria = ? AND periodo = ?',
                [this.idAlumno, this.idMateria, this.periodo]
            );

            if (existing.length > 0) {
                throw new Error('Ya existe una calificación para este alumno en esta materia y periodo');
            }

            const result = await db.query(
                'INSERT INTO Calificaciones (idMateria, idAlumno, calificacion, periodo) VALUES (?, ?, ?, ?)',
                [this.idMateria, this.idAlumno, this.calificacion, this.periodo]
            );
            this.idCalificaciones = result.insertId;
            return result;
        }
    }

    async delete() {
        if (!this.idCalificaciones) throw new Error('Cannot delete unsaved grade');
        return await db.query('DELETE FROM Calificaciones WHERE idCalificaciones = ?', [this.idCalificaciones]);
    }
}

module.exports = Calificacion;