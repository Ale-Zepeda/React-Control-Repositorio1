function validarDatosUsuario(datos) {
    const errores = [];
    
    // Validar campos requeridos
    if (!datos.nombre) errores.push('El nombre es requerido');
    if (!datos.email) errores.push('El email es requerido');
    if (!datos.password && !datos.idUsuario) errores.push('La contraseña es requerida para nuevos usuarios');
    if (!datos.tipo_usuario && !datos.rol) errores.push('El tipo de usuario es requerido');

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (datos.email && !emailRegex.test(datos.email)) {
        errores.push('El formato del email no es válido');
    }

    // Validar tipo de usuario
    const tiposValidos = ['admin', 'profesor', 'tutor', 'alumno'];
    const tipoUsuario = datos.tipo_usuario || datos.rol;
    if (tipoUsuario && !tiposValidos.includes(tipoUsuario)) {
        errores.push('El tipo de usuario no es válido');
    }

    return {
        valido: errores.length === 0,
        errores: errores
    };
}

module.exports = {
    validarDatosUsuario
};