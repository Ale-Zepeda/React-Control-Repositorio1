const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initGrupos() {
    const sql = fs.readFileSync(path.join(__dirname, 'init-grupos.sql'), 'utf8');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
        user: process.env.DB_USER || 'ale',
        password: process.env.DB_PASSWORD || 'marianita.13.13',
        database: process.env.DB_NAME || 'controlescolar',
        multipleStatements: true
    });

    try {
        await connection.query(sql);
        console.log('✅ Tabla de grupos inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando tabla de grupos:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

initGrupos().catch(console.error);