const Aviso = require('../models/Aviso');

class AvisoService {
    async obtenerTodos() {
        return await Aviso.getAll();
    }

    async obtenerPorId(id) {
        const aviso = await Aviso.findById(id);
        if (!aviso) {
            throw new Error('Aviso no encontrado');
        }
        return aviso;
    }

    async obtenerPorGrupo(grupoId) {
        return await Aviso.getByGrupo(grupoId);
    }

    async obtenerRecientes(limite = 10) {
        return await Aviso.getAvisosRecientes(limite);
    }

    async obtenerPorFecha(fecha) {
        return await Aviso.getAvisosPorFecha(fecha);
    }

    async crear(datos) {
        const aviso = new Aviso({
            ...datos,
            fecha: datos.fecha || new Date().toISOString().split('T')[0],
            hora: datos.hora || new Date().toTimeString().split(' ')[0]
        });
        await aviso.save();
        return aviso;
    }

    async actualizar(id, datos) {
        const aviso = await Aviso.findById(id);
        if (!aviso) {
            throw new Error('Aviso no encontrado');
        }
        Object.assign(aviso, datos);
        await aviso.save();
        return aviso;
    }

    async eliminar(id) {
        const aviso = await Aviso.findById(id);
        if (!aviso) {
            throw new Error('Aviso no encontrado');
        }
        await aviso.delete();
    }
}

module.exports = new AvisoService();