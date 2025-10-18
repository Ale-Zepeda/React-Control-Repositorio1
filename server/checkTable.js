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
  
  // Verificar estructura de la tabla Usuarios
  db.query('DESCRIBE Usuarios', (err, results) => {
    if (err) {
      console.error('❌ Error consultando tabla:', err.message);
    } else {
      console.log('\n📋 Estructura de la tabla Usuarios:');
      results.forEach(column => {
        console.log(`   ${column.Field} | ${column.Type} | ${column.Null} | ${column.Key} | ${column.Default}`);
      });
    }
    
    // También listar todos los usuarios actuales
    db.query('SELECT * FROM Usuarios', (err, users) => {
      if (err) {
        console.error('❌ Error consultando usuarios:', err.message);
      } else {
        console.log(`\n👥 Usuarios existentes (${users.length}):`);
        users.forEach(user => {
          console.log(`   ID: ${user.id || user.idUsuarios} | Email: ${user.email || user.correo || 'N/A'} | Tipo: ${user.tipo_usuario || user.rol || 'N/A'}`);
        });
      }
      db.end();
    });
  });
});