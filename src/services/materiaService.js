const Materia = require('../models/Materia');

class MateriaService {
    async obtenerTodas() {
        return await Materia.getAll();
    }

    async obtenerPorId(id) {
        const materia = await Materia.findById(id);
        if (!materia) {
            throw new Error('Materia no encontrada');
        }
        return materia;
    }

    async obtenerPorProfesor(profesorId) {
        return await Materia.getByProfesor(profesorId);
    }

    async obtenerPorGrupo(grupoId) {
        return await Materia.getByGrupo(grupoId);
    }

    async crear(datos) {
        const materia = new Materia(datos);
        await materia.save();
        return materia;
    }

    async actualizar(id, datos) {
        const materia = await Materia.findById(id);
        if (!materia) {
            throw new Error('Materia no encontrada');
        }
        Object.assign(materia, datos);
        await materia.save();
        return materia;
    }

    async eliminar(id) {
        const materia = await Materia.findById(id);
        if (!materia) {
            throw new Error('Materia no encontrada');
        }
        await materia.delete();
    }

    async asignarProfesor(materiaId, profesorId, datos) {
        const materia = await Materia.findById(materiaId);
        if (!materia) {
            throw new Error('Materia no encontrada');
        }

        await db.query(
            'INSERT INTO Profesores (idUsuarioProfesor, idMateria, turno) VALUES (?, ?, ?)',
            [profesorId, materiaId, datos.turno || 'matutino']
        );
    }
}

module.exports = new MateriaService();