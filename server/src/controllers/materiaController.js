const materiaService = require('../services/materiaService');

class MateriaController {
    async getAll(req, res) {
        try {
            const materias = await materiaService.obtenerTodas();
            res.json(materias);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const materia = await materiaService.obtenerPorId(req.params.id);
            res.json(materia);
        } catch (error) {
            if (error.message === 'Materia no encontrada') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async getByProfesor(req, res) {
        try {
            const materias = await materiaService.obtenerPorProfesor(req.params.profesorId);
            res.json(materias);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getByGrupo(req, res) {
        try {
            const materias = await materiaService.obtenerPorGrupo(req.params.grupoId);
            res.json(materias);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            const materia = await materiaService.crear(req.body);
            res.status(201).json(materia);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const materia = await materiaService.actualizar(req.params.id, req.body);
            res.json(materia);
        } catch (error) {
            if (error.message === 'Materia no encontrada') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async delete(req, res) {
        try {
            await materiaService.eliminar(req.params.id);
            res.json({ message: 'Materia eliminada correctamente' });
        } catch (error) {
            if (error.message === 'Materia no encontrada') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async asignarProfesor(req, res) {
        try {
            await materiaService.asignarProfesor(req.params.id, req.body.profesorId, req.body);
            res.json({ message: 'Profesor asignado correctamente' });
        } catch (error) {
            if (error.message.includes('no encontrada')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
}

module.exports = new MateriaController();