const Grupo = require('../models/Grupo');

class GrupoService {
    async obtenerTodos() {
        return await Grupo.getAll();
    }

    async obtenerPorId(id) {
        const grupo = await Grupo.findById(id);
        if (!grupo) {
            throw new Error('Grupo no encontrado');
        }
        return grupo;
    }

    async obtenerConAlumnos() {
        return await Grupo.getAllWithAlumnos();
    }

    async crear(datos) {
        const grupo = new Grupo(datos);
        await grupo.save();
        return grupo;
    }

    async actualizar(id, datos) {
        const grupo = await Grupo.findById(id);
        if (!grupo) {
            throw new Error('Grupo no encontrado');
        }
        Object.assign(grupo, datos);
        await grupo.save();
        return grupo;
    }

    async eliminar(id) {
        const grupo = await Grupo.findById(id);
        if (!grupo) {
            throw new Error('Grupo no encontrado');
        }
        await grupo.delete();
    }
}

module.exports = new GrupoService();