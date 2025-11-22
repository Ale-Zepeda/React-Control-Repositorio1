const mysql = require('mysql2/promise');

async function dropTutorColumns() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'mysql-escueladigital.mysql.database.azure.com',
            user: 'ale', 
            password: 'marianita.13.13',
            database: 'controlescolar'
        });

        console.log('🔍 ESTRUCTURA ACTUAL DE TABLA TUTOR:');
        const [columns] = await connection.execute('DESCRIBE tutor');
        columns.forEach(col => {
            console.log(`   ${col.Field} (${col.Type})`);
        });

        console.log('\n🗑️ ELIMINANDO COLUMNAS...');
        
        // Eliminar lugar_trabajo
        try {
            await connection.execute('ALTER TABLE tutor DROP COLUMN lugar_trabajo');
            console.log('   ✅ Eliminada: lugar_trabajo');
        } catch (e) {
            console.log(`   ⚠️ lugar_trabajo: ${e.message}`);
        }
        
        // Eliminar telefono_trabajo  
        try {
            await connection.execute('ALTER TABLE tutor DROP COLUMN telefono_trabajo');
            console.log('   ✅ Eliminada: telefono_trabajo');
        } catch (e) {
            console.log(`   ⚠️ telefono_trabajo: ${e.message}`);
        }
        
        console.log('\n📋 ESTRUCTURA FINAL:');
        const [finalColumns] = await connection.execute('DESCRIBE tutor');
        finalColumns.forEach(col => {
            console.log(`   ${col.Field} (${col.Type})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

dropTutorColumns();