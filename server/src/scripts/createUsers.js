const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1309',
  database: process.env.DB_NAME || 'controlescolar'
});

// Usuarios de prueba
const usuarios = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    nombre: 'Administrador del Sistema',
    tipo_usuario: 'admin'
  },
  {
    email: 'profesor@example.com',
    password: 'profesor123',
    nombre: 'Juan Carlos Profesor',
    tipo_usuario: 'profesor'
  },
  {
    email: 'tutor@example.com',
    password: 'tutor123',
    nombre: 'María Elena Tutor',
    tipo_usuario: 'tutor'
  },
  {
    email: 'alumno@example.com',
    password: 'alumno123',
    nombre: 'Pedro González Alumno',
    tipo_usuario: 'alumno'
  }
];

console.log('🔄 Conectando a la base de datos...');

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
    return;
  }
  
  console.log('✅ Conectado a MySQL');
  
  // Crear usuarios uno por uno
  let insertados = 0;
  
  usuarios.forEach((usuario, index) => {
    const { email, password, nombre, tipo_usuario } = usuario;
    
    db.query(
      'INSERT INTO Usuarios (email, password, nombre, tipo_usuario, Ap, Am, calle, colonia, numero, cp, telefono, idNivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, password, nombre, tipo_usuario, 'Apellido', 'Paterno', 'Calle 123', 'Centro', '123', 12345, 1234567890, 1],
      (err, results) => {
        if (err) {
          console.error(`❌ Error insertando usuario ${email}:`, err.message);
        } else {
          console.log(`✅ Usuario creado: ${email} (${tipo_usuario})`);
        }
        
        insertados++;
        if (insertados === usuarios.length) {
          console.log('\n🎉 Proceso completado!');
          console.log('\n🔐 Credenciales de prueba:');
          usuarios.forEach(u => {
            console.log(`   ${u.tipo_usuario.toUpperCase()}: ${u.email} / ${u.password}`);
          });
          db.end();
        }
      }
    );
  });
});