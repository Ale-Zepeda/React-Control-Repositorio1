const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateAlumnosTable() {
    let connection;
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'mysql-escueladigital.mysql.database.azure.com',
            user: process.env.DB_USER || 'ale',
            password: process.env.DB_PASSWORD || 'marianita.13.13',
            database: process.env.DB_NAME || 'controlescolar'
        });

        console.log('🔍 Verificando estructura actual...');
        const [columns] = await connection.query('DESCRIBE alumnos');
        console.log('\nEstructura actual de la tabla alumnos:');
        columns.forEach(col => console.log(col.Field));

        // Modificar la tabla alumnos para usar idUsuario
        console.log('\n🔄 Actualizando estructura de la tabla alumnos...');
        await connection.query(`
            ALTER TABLE alumnos
            CHANGE COLUMN idUsuarios idUsuario INT NOT NULL,
            DROP FOREIGN KEY fk_alumnos_usuarios,
            DROP INDEX uk_alumnos_usuario,
            ADD CONSTRAINT fk_alumnos_usuarios 
            FOREIGN KEY (idUsuario) 
            REFERENCES usuarios(idUsuario) 
            ON UPDATE CASCADE 
            ON DELETE CASCADE,
            ADD UNIQUE INDEX uk_alumnos_usuario (idUsuario)
        `);

        // Verificar la nueva estructura
        const [newColumns] = await connection.query('DESCRIBE alumnos');
        console.log('\n✅ Nueva estructura de la tabla alumnos:');
        newColumns.forEach(col => console.log(col.Field));

        // Verificar las relaciones
        const [relations] = await connection.query(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                TABLE_NAME = 'alumnos'
                AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        console.log('\n🔗 Relaciones actuales:');
        relations.forEach(rel => {
            console.log(`${rel.TABLE_NAME}.${rel.COLUMN_NAME} -> ${rel.REFERENCED_TABLE_NAME}.${rel.REFERENCED_COLUMN_NAME}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateAlumnosTable();