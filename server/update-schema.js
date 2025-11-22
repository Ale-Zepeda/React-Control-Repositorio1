const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
            user: process.env.DB_USER || 'ale',
            password: process.env.DB_PASSWORD || 'marianita.13.13',
            database: process.env.DB_NAME || 'controlescolar'
        });

        console.log('🔄 Actualizando esquema de la base de datos...');

        // Renombrar columna en tabla alumnos
        await connection.query(`ALTER TABLE Alumnos 
            CHANGE COLUMN idUsuarios idUsuario INT NOT NULL,
            DROP FOREIGN KEY fk_alumnos_usuarios,
            DROP INDEX uk_alumnos_usuario,
            ADD UNIQUE KEY uk_alumnos_usuario (idUsuario),
            ADD CONSTRAINT fk_alumnos_usuarios 
            FOREIGN KEY (idUsuario) 
            REFERENCES Usuarios(idUsuario) 
            ON UPDATE CASCADE 
            ON DELETE CASCADE`);

        console.log('✅ Esquema actualizado exitosamente');

        const [columns] = await connection.query('DESCRIBE Alumnos');
        console.log('\nEstructura actual de la tabla Alumnos:');
        columns.forEach(col => {
            console.log(`${col.Field}: ${col.Type}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateSchema();