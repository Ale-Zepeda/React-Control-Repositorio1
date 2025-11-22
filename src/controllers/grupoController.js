const grupoService = require('../services/grupoService');
const db = require('../config/db');

class GrupoController {
    async getAll(req, res) {
        try {
            const [grupos] = await db.query(`
                SELECT 
                    g.idGrupo,
                    g.especialidad,
                    g.semestre,
                    g.turno,
                    (SELECT COUNT(*) FROM alumnos a WHERE a.idGrupo = g.idGrupo) as totalAlumnos
                FROM grupo g
                ORDER BY 
                    g.especialidad,
                    CASE 
                        WHEN g.semestre REGEXP '^1' THEN 1
                        WHEN g.semestre REGEXP '^2' THEN 2
                        WHEN g.semestre REGEXP '^3' THEN 3
                        WHEN g.semestre REGEXP '^4' THEN 4
                        WHEN g.semestre REGEXP '^5' THEN 5
                        WHEN g.semestre REGEXP '^6' THEN 6
                        ELSE 99
                    END,
                    g.turno
            `);

            // Organizar los grupos jerárquicamente
            const gruposOrganizados = {};
            
            grupos.forEach(grupo => {
                if (!gruposOrganizados[grupo.especialidad]) {
                    gruposOrganizados[grupo.especialidad] = {
                        nombre: grupo.especialidad,
                        semestres: {}
                    };
                }
                
                if (!gruposOrganizados[grupo.especialidad].semestres[grupo.semestre]) {
                    gruposOrganizados[grupo.especialidad].semestres[grupo.semestre] = {
                        nombre: grupo.semestre,
                        turnos: {}
                    };
                }
                
                if (!gruposOrganizados[grupo.especialidad].semestres[grupo.semestre].turnos[grupo.turno]) {
                    gruposOrganizados[grupo.especialidad].semestres[grupo.semestre].turnos[grupo.turno] = [];
                }
                
                gruposOrganizados[grupo.especialidad].semestres[grupo.semestre].turnos[grupo.turno] = [
                    ...gruposOrganizados[grupo.especialidad].semestres[grupo.semestre].turnos[grupo.turno],
                    {
                        idGrupo: grupo.idGrupo,
                        totalAlumnos: grupo.totalAlumnos || 0
                    }
                ];
            });

            // Convertir a array plano para el frontend
            const gruposArray = grupos.map(grupo => ({
                idGrupo: grupo.idGrupo,
                especialidad: grupo.especialidad,
                semestre: grupo.semestre,
                turno: grupo.turno,
                totalAlumnos: grupo.totalAlumnos || 0
            }));

            res.json(gruposArray);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const grupo = await grupoService.obtenerPorId(req.params.id);
            res.json(grupo);
        } catch (error) {
            if (error.message === 'Grupo no encontrado') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async getAllWithAlumnos(req, res) {
        try {
            const grupos = await grupoService.obtenerConAlumnos();
            res.json(grupos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            const grupoData = {
                ...req.body,
                totalAlumnos: 0 // Aseguramos que totalAlumnos inicie en 0
            };
            const [result] = await db.query(
                'INSERT INTO grupo (especialidad, turno, semestre, totalAlumnos) VALUES (?, ?, ?, ?)',
                [grupoData.especialidad, grupoData.turno, grupoData.semestre, grupoData.totalAlumnos]
            );
            const [nuevoGrupo] = await db.query(
                'SELECT idGrupo, especialidad, turno, semestre, totalAlumnos FROM grupo WHERE idGrupo = ?',
                [result.insertId]
            );
            res.status(201).json(nuevoGrupo[0]);
        } catch (error) {
            console.error('Error al crear grupo:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const grupo = await grupoService.actualizar(req.params.id, req.body);
            res.json(grupo);
        } catch (error) {
            if (error.message === 'Grupo no encontrado') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async delete(req, res) {
        try {
            const idGrupo = req.params.id;
            
            // Verificar si el grupo tiene alumnos
            const [alumnos] = await db.query(
                'SELECT COUNT(*) as total FROM alumnos WHERE idGrupo = ?',
                [idGrupo]
            );

            if (alumnos[0].total > 0) {
                return res.status(400).json({ 
                    error: `No se puede eliminar el grupo porque tiene ${alumnos[0].total} alumno(s) asignado(s). Por favor, reasigne o elimine los alumnos primero.`
                });
            }

            // Si no tiene alumnos, proceder con la eliminación
            const [result] = await db.query(
                'DELETE FROM grupo WHERE idGrupo = ?',
                [idGrupo]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Grupo no encontrado' });
            }

            res.json({ message: 'Grupo eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar grupo:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new GrupoController();