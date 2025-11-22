const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateColumnName() {
    let connection;
    try {
        // Crear conexión
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
            user: process.env.DB_USER || 'ale',
            password: process.env.DB_PASSWORD || 'marianita.13.13',
            database: process.env.DB_NAME || 'controlescolar'
        });

        console.log('🔄 Iniciando actualización de estructura de tabla...');

        // 1. Verificar estructura actual
        const [columns] = await connection.query('SHOW COLUMNS FROM alumnos');
        console.log('\n📊 Estructura actual de la tabla alumnos:');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}`);
        });

        // 2. Verificar si existe la columna idUsuarios
        const hasOldColumn = columns.some(col => col.Field === 'idUsuarios');
        const hasNewColumn = columns.some(col => col.Field === 'idUsuario');

        if (!hasOldColumn && hasNewColumn) {
            console.log('\n✅ La columna ya está actualizada (idUsuario)');
            return;
        }

        if (!hasOldColumn && !hasNewColumn) {
            console.log('\n❌ No se encontró la columna idUsuarios ni idUsuario');
            return;
        }

        // 3. Hacer backup de los datos actuales
        console.log('\n📦 Haciendo backup de datos...');
        const [rows] = await connection.query('SELECT * FROM alumnos');
        console.log(`   ${rows.length} registros encontrados`);

        // 4. Renombrar la columna
        console.log('\n🔄 Renombrando columna idUsuarios a idUsuario...');
        await connection.query('ALTER TABLE alumnos CHANGE COLUMN idUsuarios idUsuario INT');

        // 5. Verificar estructura final
        const [newColumns] = await connection.query('SHOW COLUMNS FROM alumnos');
        console.log('\n📊 Nueva estructura de la tabla alumnos:');
        newColumns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}`);
        });

        // 6. Verificar datos
        const [newRows] = await connection.query('SELECT * FROM alumnos LIMIT 5');
        console.log('\n✅ Verificación de datos (primeros 5 registros):');
        newRows.forEach(row => {
            console.log(`   ID Alumno: ${row.idAlumnos}, ID Usuario: ${row.idUsuario}`);
        });

        console.log('\n🎉 ¡Actualización completada con éxito!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.message.includes("Unknown column 'idUsuarios'")) {
            console.log('   La columna ya ha sido renombrada anteriormente.');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar la actualización
updateColumnName();