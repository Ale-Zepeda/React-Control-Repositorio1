const db = require('../config/db');

class Grupo {
    constructor(data) {
        this.idGrupo = data.idGrupo;
        this.especialidad = data.especialidad;
        this.turno = data.turno;
        this.semestre = data.semestre;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM grupo WHERE idGrupo = ?', [id]);
        return rows.length ? new Grupo(rows[0]) : null;
    }

    static async getAll() {
        const [rows] = await db.query('SELECT * FROM grupo');
        return rows.map(row => new Grupo(row));
    }

    static async getAllWithAlumnos() {
        const [rows] = await db.query(`
            SELECT g.*, 
                   COUNT(a.idAlumnos) as totalAlumnos,
                   GROUP_CONCAT(DISTINCT u.nombre) as alumnos
            FROM grupo g
            LEFT JOIN alumnos a ON g.idGrupo = a.idGrupo
            LEFT JOIN usuarios u ON a.idUsuario = u.idUsuario
            GROUP BY g.idGrupo
        `);
        return rows;
    }

    async save() {
        if (this.idGrupo) {
            const result = await db.query(
                'UPDATE grupo SET especialidad = ?, turno = ?, semestre = ? WHERE idGrupo = ?',
                [this.especialidad, this.turno, this.semestre, this.idGrupo]
            );
            return result;
        } else {
            const result = await db.query(
                'INSERT INTO grupo (especialidad, turno, semestre) VALUES (?, ?, ?)',
                [this.especialidad, this.turno, this.semestre]
            );
            this.idGrupo = result.insertId;
            return result;
        }
    }

    async delete() {
        if (!this.idGrupo) throw new Error('Cannot delete unsaved group');
        return await db.query('DELETE FROM Grupo WHERE idGrupo = ?', [this.idGrupo]);
    }
}

module.exports = Grupo;