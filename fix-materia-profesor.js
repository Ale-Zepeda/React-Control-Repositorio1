const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateMateriaProfesorTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
    user: process.env.DB_USER || 'ale',
    password: process.env.DB_PASSWORD || 'marianita.13.13',
    database: process.env.DB_NAME || 'controlescolar'
  });

  try {
    console.log('Modificando tabla materia_profesor para permitir NULL en idGrupo...');
    
    // Modificar la columna idGrupo para permitir NULL
    await connection.query(`
      ALTER TABLE materia_profesor 
      MODIFY COLUMN idGrupo int NULL
    `);
    
    console.log('✅ Tabla materia_profesor modificada exitosamente');
    console.log('   - idGrupo ahora permite valores NULL');
    
  } catch (error) {
    console.error('❌ Error modificando tabla:', error.message);
  } finally {
    await connection.end();
  }
}

updateMateriaProfesorTable();