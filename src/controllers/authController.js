const db = require('../config/db');

class AuthController {
    async login(req, res) {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }
        
        console.log('Intento de login:', { email, password });
        
        try {
            // Consulta JOIN para obtener idAlumno si es alumno e idTutor si es tutor
            const query = `
                SELECT u.*, a.idAlumnos, t.idTutor 
                FROM Usuarios u 
                LEFT JOIN alumnos a ON u.idUsuario = a.idUsuario 
                LEFT JOIN tutor t ON u.idUsuario = t.idUsuario
                WHERE u.email = ? AND u.password = ?
            `;
            
            const [results] = await db.query(query, [email, password]);
            
            console.log('Resultados de la consulta:', results);
            
            if (results.length === 0) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }
            
            const usuario = results[0];
            
            // Por simplicidad, usamos un token básico (en producción usarías JWT)
            const token = `token_${usuario.idUsuario}_${Date.now()}`;
            
            const response = {
                token,
                usuario: {
                    id: usuario.idUsuario,
                    idUsuario: usuario.idUsuario,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    rol: usuario.tipo_usuario,
                    idAlumno: usuario.idAlumnos || null,
                    idTutor: usuario.idTutor || null
                }
            };
            
            console.log('Enviando respuesta:', response);
            res.json(response);
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();