const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const Profesor = require('../models/Profesor');
const Tutor = require('../models/Tutor');

class UsuarioService {
  async crearUsuario(datos) {
    const { rol, ...usuarioData } = datos;
    
    // Crear usuario base
    const usuario = new Usuario({
      ...usuarioData,
      tipo_usuario: rol,
      idNivel: this.getNivelByRol(rol)
    });
    await usuario.save();

    // Procesar según el rol
    switch (rol) {
      case 'alumno':
        await this.procesarAlumno(usuario.idUsuario, datos);
        break;
      case 'profesor':
        await this.procesarProfesor(usuario.idUsuario, datos);
        break;
      case 'tutor':
        await this.procesarTutor(usuario.idUsuario, datos);
        break;
    }

    return usuario;
  }

  async actualizarUsuario(id, datos) {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    Object.assign(usuario, datos);
    await usuario.save();

    if (datos.materias && usuario.tipo_usuario === 'profesor') {
      await this.actualizarMateriasProfesor(id, datos.materias);
    }

    return usuario;
  }

  async obtenerUsuarioPorId(id) {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const datosExtra = await this.obtenerDatosSegunRol(usuario);
    return { ...usuario, ...datosExtra };
  }

  async obtenerTodos(filtroRol = null) {
    let usuarios = await Usuario.getAll();
    if (filtroRol) {
      usuarios = usuarios.filter(u => u.tipo_usuario === filtroRol);
    }
    
    // Agregar datos específicos según rol
    const usuariosConDatos = await Promise.all(
      usuarios.map(async (usuario) => {
        const datosExtra = await this.obtenerDatosSegunRol(usuario);
        return { ...usuario, ...datosExtra };
      })
    );

    return usuariosConDatos;
  }

  async eliminarUsuario(id) {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    await usuario.delete();
  }

  // Métodos privados de ayuda
  private getNivelByRol(rol) {
    const niveles = {
      admin: 1,
      profesor: 2,
      tutor: 3,
      alumno: 4
    };
    return niveles[rol] || 4;
  }

  private async procesarAlumno(usuarioId, datos) {
    const alumno = new Alumno({
      idUsuario: usuarioId,
      idGrupo: datos.idGrupo || 1
    });
    await alumno.save();

    // Si viene información del tutor, procesarla
    if (datos.tutorNombre) {
      const tutorData = {
        nombre: datos.tutorNombre,
        email: datos.tutorEmail || `tutor_${Date.now()}@example.com`,
        password: datos.tutorPassword || 'tutor123',
        rol: 'tutor'
      };
      const tutor = await this.crearUsuario(tutorData);
      await new Tutor({
        idUsuario: tutor.idUsuario,
        idAlumno: alumno.idAlumnos
      }).save();
    }
  }

  private async procesarProfesor(usuarioId, datos) {
    if (datos.materias) {
      const materias = Array.isArray(datos.materias) ? datos.materias : [datos.materias];
      for (const materia of materias) {
        await new Profesor({
          idUsuarioProfesor: usuarioId,
          materia,
          semestre: datos.semestre || '1',
          turno: datos.turno || 'matutino'
        }).save();
      }
    }
  }

  private async procesarTutor(usuarioId, datos) {
    if (datos.alumnoId) {
      await new Tutor({
        idUsuario: usuarioId,
        idAlumno: datos.alumnoId
      }).save();
    }
  }

  private async obtenerDatosSegunRol(usuario) {
    switch (usuario.tipo_usuario) {
      case 'profesor':
        const materias = await Profesor.getMateriasByProfesor(usuario.idUsuario);
        return { materias };
      case 'tutor':
        const alumnos = await Tutor.getAlumnosByTutor(usuario.idUsuario);
        return { alumnos };
      case 'alumno':
        const alumnoData = await Alumno.findByUsuarioId(usuario.idUsuario);
        return { alumnoData };
      default:
        return {};
    }
  }
}

module.exports = new UsuarioService();