const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
  user: process.env.DB_USER || 'ale',
  password: process.env.DB_PASSWORD || 'marianita.13.13',
  database: process.env.DB_NAME || 'controlescolar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: false, // Permitir conexiones sin verificar el certificado
    ca: process.env.DB_CA_CERT || undefined // Agregar certificado CA si está disponible
  }
})

module.exports = pool
