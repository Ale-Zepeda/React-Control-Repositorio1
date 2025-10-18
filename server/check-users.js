const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

db.query('SELECT u.email, u.nombre, u.tipo_usuario as rol, a.idAlumnos FROM usuarios u LEFT JOIN alumnos a ON u.idUsuario = a.idUsuarios WHERE u.tipo_usuario = "alumno"', (err, results) => {
  if(err) {
    console.error('❌ Error:', err);
  } else {
    console.log('👨‍🎓 Usuarios Alumnos:');
    console.table(results);
  }
  db.end();
});