const db = require('../config/db');

class Aviso {
    constructor(data) {
        this.idAvisos = data.idAvisos;
        this.mensaje = data.mensaje;
        this.fecha = data.fecha;
        this.hora = data.hora;
        this.idGrupo = data.idGrupo;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM Avisos WHERE idAvisos = ?', [id]);
        return rows.length ? new Aviso(rows[0]) : null;
    }

    static async getAll() {
        const [rows] = await db.query(`
            SELECT a.*, g.grado, g.turno
            FROM Avisos a
            JOIN Grupo g ON a.idGrupo = g.idGrupo
            ORDER BY a.fecha DESC, a.hora DESC
        `);
        return rows;
    }

    static async getByGrupo(grupoId) {
        const [rows] = await db.query(`
            SELECT a.*, g.grado, g.turno
            FROM Avisos a
            JOIN Grupo g ON a.idGrupo = g.idGrupo
            WHERE a.idGrupo = ?
            ORDER BY a.fecha DESC, a.hora DESC
        `, [grupoId]);
        return rows;
    }

    async save() {
        if (this.idAvisos) {
            const result = await db.query(
                'UPDATE Avisos SET mensaje = ?, fecha = ?, hora = ?, idGrupo = ? WHERE idAvisos = ?',
                [this.mensaje, this.fecha, this.hora, this.idGrupo, this.idAvisos]
            );
            return result;
        } else {
            const result = await db.query(
                'INSERT INTO Avisos (mensaje, fecha, hora, idGrupo) VALUES (?, ?, ?, ?)',
                [this.mensaje, this.fecha, this.hora, this.idGrupo]
            );
            this.idAvisos = result.insertId;
            return result;
        }
    }

    async delete() {
        if (!this.idAvisos) throw new Error('Cannot delete unsaved notice');
        return await db.query('DELETE FROM Avisos WHERE idAvisos = ?', [this.idAvisos]);
    }

    // Métodos especializados para avisos
    static async getAvisosRecientes(limite = 10) {
        const [rows] = await db.query(`
            SELECT a.*, g.grado, g.turno
            FROM Avisos a
            JOIN Grupo g ON a.idGrupo = g.idGrupo
            ORDER BY a.fecha DESC, a.hora DESC
            LIMIT ?
        `, [limite]);
        return rows;
    }

    static async getAvisosPorFecha(fecha) {
        const [rows] = await db.query(`
            SELECT a.*, g.grado, g.turno
            FROM Avisos a
            JOIN Grupo g ON a.idGrupo = g.idGrupo
            WHERE DATE(a.fecha) = ?
            ORDER BY a.hora DESC
        `, [fecha]);
        return rows;
    }
}

module.exports = Aviso;