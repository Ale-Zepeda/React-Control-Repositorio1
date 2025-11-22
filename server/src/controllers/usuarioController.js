const Usuario = require('../models/Usuario');
const { validarDatosUsuario } = require('../utils/validators');

class UsuarioController {
  async getAll(req, res) {
    try {
      const usuarios = await Usuario.getAll();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const validacion = validarDatosUsuario(req.body);
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.errores });
      }

      const usuario = new Usuario(req.body);
      await usuario.save();
      res.status(201).json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const validacion = validarDatosUsuario(req.body);
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.errores });
      }

      Object.assign(usuario, req.body);
      await usuario.save();
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await usuario.delete();
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const activo = req.body?.activo ?? 1;
      usuario.activo = activo ? 1 : 0;
      await usuario.save();
      
      res.json({ message: 'Estado actualizado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UsuarioController();