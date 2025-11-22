const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// GET - Obtener todos los usuarios (opcional ?rol=admin|profesor|tutor|alumno)
router.get('/', usuarioController.getAll);

// GET - Obtener usuario por id
router.get('/:id', usuarioController.getById);

// POST - Crear usuario
router.post('/', usuarioController.create);

// PUT - Actualizar usuario
router.put('/:id', usuarioController.update);

// PUT - Activar/Desactivar usuario
router.put('/:id/activo', usuarioController.updateStatus);

// DELETE - Eliminar usuario
router.delete('/:id', usuarioController.delete);

module.exports = router;
