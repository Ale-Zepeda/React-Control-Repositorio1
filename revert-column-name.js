const mysql = require('mysql2/promise');
require('dotenv').config();

async function revertColumnName() {
    let connection;
    try {
        // Crear conexión
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
            user: process.env.DB_USER || 'ale',
            password: process.env.DB_PASSWORD || 'marianita.13.13',
            database: process.env.DB_NAME || 'controlescolar'
        });

        console.log('🔄 Revirtiendo cambio de nombre de columna...');

        // 1. Verificar estructura actual
        const [columns] = await connection.query('SHOW COLUMNS FROM alumnos');
        console.log('\n📊 Estructura actual de la tabla alumnos:');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}`);
        });

        // 2. Renombrar la columna de vuelta a idUsuarios
        console.log('\n🔄 Renombrando columna idUsuario a idUsuarios...');
        await connection.query('ALTER TABLE alumnos CHANGE COLUMN idUsuario idUsuarios INT');

        // 3. Verificar estructura final
        const [newColumns] = await connection.query('SHOW COLUMNS FROM alumnos');
        console.log('\n📊 Nueva estructura de la tabla alumnos:');
        newColumns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}`);
        });

        console.log('\n✅ Columna renombrada exitosamente');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar la actualización
revertColumnName();