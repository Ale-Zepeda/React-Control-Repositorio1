const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1309',
  database: process.env.DB_NAME || 'controlescolar'
});

console.log('🔄 Conectando a la base de datos...');

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
    return;
  }
  
  console.log('✅ Conectado a MySQL');
  
  // Agregar columna password
  console.log('🔄 Agregando columna password...');
  db.query('ALTER TABLE Usuarios ADD COLUMN password VARCHAR(255) NOT NULL', (err) => {
    if (err && !err.message.includes('Duplicate column name')) {
      console.error('❌ Error agregando columna password:', err.message);
    } else {
      console.log('✅ Columna password agregada');
    }
    
    // Agregar columna tipo_usuario
    console.log('🔄 Agregando columna tipo_usuario...');
    db.query('ALTER TABLE Usuarios ADD COLUMN tipo_usuario ENUM("admin", "profesor", "tutor", "alumno") NOT NULL DEFAULT "alumno"', (err) => {
      if (err && !err.message.includes('Duplicate column name')) {
        console.error('❌ Error agregando columna tipo_usuario:', err.message);
      } else {
        console.log('✅ Columna tipo_usuario agregada');
      }
      
      console.log('🎉 Tabla actualizada correctamente!');
      console.log('📋 Ahora puedes ejecutar el script para crear usuarios');
      db.end();
    });
  });
});