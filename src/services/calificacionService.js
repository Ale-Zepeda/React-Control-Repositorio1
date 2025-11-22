const Calificacion = require('../models/Calificacion');

class CalificacionService {
    async obtenerTodas() {
        return await Calificacion.getAll();
    }

    async obtenerPorId(id) {
        const calificacion = await Calificacion.findById(id);
        if (!calificacion) {
            throw new Error('Calificación no encontrada');
        }
        return calificacion;
    }

    async obtenerPorAlumno(alumnoId) {
        return await Calificacion.getByAlumno(alumnoId);
    }

    async obtenerPorMateria(materiaId) {
        return await Calificacion.getByMateria(materiaId);
    }

    async crear(datos) {
        const calificacion = new Calificacion(datos);
        try {
            await calificacion.save();
            return calificacion;
        } catch (error) {
            if (error.message.includes('Ya existe una calificación')) {
                throw new Error('Ya existe una calificación para este alumno en esta materia y periodo');
            }
            throw error;
        }
    }

    async actualizar(id, datos) {
        const calificacion = await Calificacion.findById(id);
        if (!calificacion) {
            throw new Error('Calificación no encontrada');
        }
        Object.assign(calificacion, datos);
        await calificacion.save();
        return calificacion;
    }

    async eliminar(id) {
        const calificacion = await Calificacion.findById(id);
        if (!calificacion) {
            throw new Error('Calificación no encontrada');
        }
        await calificacion.delete();
    }

    async obtenerPromedioPorAlumno(alumnoId) {
        const calificaciones = await Calificacion.getByAlumno(alumnoId);
        if (calificaciones.length === 0) {
            return 0;
        }
        const suma = calificaciones.reduce((acc, cal) => acc + cal.calificacion, 0);
        return suma / calificaciones.length;
    }

    async obtenerPromedioPorMateria(materiaId) {
        const calificaciones = await Calificacion.getByMateria(materiaId);
        if (calificaciones.length === 0) {
            return 0;
        }
        const suma = calificaciones.reduce((acc, cal) => acc + cal.calificacion, 0);
        return suma / calificaciones.length;
    }
}

module.exports = new CalificacionService();