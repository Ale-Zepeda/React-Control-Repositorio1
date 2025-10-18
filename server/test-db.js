const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1309',
  database: process.env.DB_NAME || 'controlescolar'
});

console.log('🔍 Probando conexión a la base de datos...');

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando:', err);
    return;
  }
  
  console.log('✅ Conectado a MySQL');
  
  // Mostrar usuarios existentes
  db.query('SELECT idUsuario, email, nombre, tipo_usuario, password FROM Usuarios LIMIT 5', (err, results) => {
    if (err) {
      console.error('❌ Error consultando usuarios:', err);
      return;
    }
    
    console.log('\n📋 Usuarios en la base de datos:');
    console.table(results);
    
    db.end();
  });
});