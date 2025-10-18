const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1309',
  database: process.env.DB_NAME || 'controlescolar'
});

// POST - Login de usuario
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }
  
  console.log('Intento de login:', { email, password });
  
  // Consulta JOIN para obtener también el idAlumno si es alumno
  const query = `
    SELECT u.*, a.idAlumnos 
    FROM Usuarios u 
    LEFT JOIN alumnos a ON u.idUsuario = a.idUsuarios 
    WHERE u.email = ? AND u.password = ?
  `;
  
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: err.message });
    }
    
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
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.tipo_usuario,
        idAlumno: usuario.idAlumnos || null
      }
    };
    
    console.log('Enviando respuesta:', response);
    res.json(response);
  });
});

module.exports = router;