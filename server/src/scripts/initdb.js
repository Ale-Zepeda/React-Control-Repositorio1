// Ejecuta schema.sql para crear/actualizar la BD
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const sqlPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(sqlPath, 'utf8');
  const config = {
    host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
    user: process.env.DB_USER || 'ale',
    password: process.env.DB_PASSWORD || 'marianita.13.13',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: true
  };
  const conn = await mysql.createConnection(config);
  try {
    await conn.query(schema);
    console.log('Base de datos inicializada.');
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error('Error al inicializar BD:', e);
  process.exit(1);
});
