const mysql = require('mysql2/promise');

async function fixTutorAlumnoRelations() {
    let connection;
    
    try {
        // Conexión a la base de datos
        connection = await mysql.createConnection({
            host: 'mysql-escueladigital.mysql.database.azure.com',
            user: 'ale', 
            password: 'marianita.13.13',
            database: 'controlescolar'
        });

        console.log('🔍 VERIFICANDO ESTRUCTURA ACTUAL...\n');

        // 1. Verificar niveles existentes
        console.log('📋 NIVELES DISPONIBLES:');
        const [niveles] = await connection.execute('SELECT idNivel, nivel FROM nivel ORDER BY idNivel');
        niveles.forEach(nivel => {
            console.log(`   ${nivel.idNivel}: ${nivel.nivel}`);
        });

        // 2. Verificar usuarios con nivel 4 (deben ser alumnos)
        console.log('\n👨‍🎓 USUARIOS CON NIVEL 4 (ALUMNOS):');
        const [usuariosNivel4] = await connection.execute(`
            SELECT idUsuario, nombre, email, idNivel, tipo_usuario 
            FROM usuarios 
            WHERE idNivel = 4 
            ORDER BY idUsuario
        `);
        
        if (usuariosNivel4.length === 0) {
            console.log('   ❌ No hay usuarios con nivel 4');
            return;
        }

        usuariosNivel4.forEach(user => {
            console.log(`   ID: ${user.idUsuario}, Nombre: ${user.nombre}, Nivel: ${user.idNivel}, Tipo: ${user.tipo_usuario}`);
        });

        // 3. Verificar tabla alumnos para usuarios con nivel 4
        console.log('\n📚 ALUMNOS EN TABLA ALUMNOS:');
        const [alumnosTable] = await connection.execute(`
            SELECT a.idAlumnos, a.idUsuarios, u.nombre, u.idNivel
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            WHERE u.idNivel = 4
            ORDER BY a.idAlumnos
        `);

        if (alumnosTable.length === 0) {
            console.log('   ❌ No hay registros en tabla alumnos para usuarios nivel 4');
        } else {
            alumnosTable.forEach(alumno => {
                console.log(`   idAlumnos: ${alumno.idAlumnos}, idUsuarios: ${alumno.idUsuarios}, Nombre: ${alumno.nombre}, Nivel: ${alumno.idNivel}`);
            });
        }

        // 4. Verificar relaciones actuales en tabla tutor
        console.log('\n🔗 RELACIONES ACTUALES EN TABLA TUTOR:');
        const [relacionesActuales] = await connection.execute(`
            SELECT 
                t.idTutor,
                t.idUsuario as tutorUsuario,
                ut.nombre as nombreTutor,
                t.idAlumno,
                ua.nombre as nombreAlumno,
                ua.idNivel as nivelAlumno
            FROM tutor t
            JOIN usuarios ut ON t.idUsuario = ut.idUsuario
            LEFT JOIN alumnos a ON t.idAlumno = a.idAlumnos
            LEFT JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
            ORDER BY t.idTutor
        `);

        if (relacionesActuales.length === 0) {
            console.log('   ❌ No hay relaciones en tabla tutor');
        } else {
            relacionesActuales.forEach(rel => {
                console.log(`   Tutor: ${rel.nombreTutor} → Alumno: ${rel.nombreAlumno || 'NO ENCONTRADO'} (Nivel: ${rel.nivelAlumno || 'N/A'})`);
            });
        }

        // 5. Buscar problemas en las relaciones
        console.log('\n🔍 ANALIZANDO PROBLEMAS...');
        
        const [problemasRelaciones] = await connection.execute(`
            SELECT 
                t.idTutor,
                t.idAlumno,
                CASE 
                    WHEN a.idAlumnos IS NULL THEN 'idAlumno no existe en tabla alumnos'
                    WHEN ua.idNivel != 4 THEN CONCAT('Alumno no tiene nivel 4, tiene nivel ', ua.idNivel)
                    ELSE 'OK'
                END as problema
            FROM tutor t
            LEFT JOIN alumnos a ON t.idAlumno = a.idAlumnos
            LEFT JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
            WHERE a.idAlumnos IS NULL OR ua.idNivel != 4
        `);

        if (problemasRelaciones.length > 0) {
            console.log('   ⚠️ PROBLEMAS ENCONTRADOS:');
            problemasRelaciones.forEach(problema => {
                console.log(`      idTutor: ${problema.idTutor}, idAlumno: ${problema.idAlumno} → ${problema.problema}`);
            });
        } else {
            console.log('   ✅ Todas las relaciones están correctas');
        }

        // 6. Proponer corrección si hay problemas
        if (problemasRelaciones.length > 0) {
            console.log('\n🔧 CORRECCIONES PROPUESTAS:');
            
            // Buscar alumnos disponibles con nivel 4
            const [alumnosDisponibles] = await connection.execute(`
                SELECT a.idAlumnos, u.nombre, u.idNivel
                FROM alumnos a
                JOIN usuarios u ON a.idUsuarios = u.idUsuario
                WHERE u.idNivel = 4
                ORDER BY a.idAlumnos
            `);

            if (alumnosDisponibles.length > 0) {
                console.log('   📋 ALUMNOS DISPONIBLES CON NIVEL 4:');
                alumnosDisponibles.forEach(alumno => {
                    console.log(`      idAlumnos: ${alumno.idAlumnos} - ${alumno.nombre}`);
                });

                // Preguntar si se desea proceder con la corrección automática
                console.log('\n❓ ¿DESEA PROCEDER CON LA CORRECCIÓN AUTOMÁTICA?');
                console.log('   Se actualizarán las relaciones para usar solo alumnos con nivel 4');
                console.log('   Ejecute nuevamente con parámetro "fix" para aplicar cambios');
                console.log('   Ejemplo: node fix-tutor-nivel4.js fix');
            }
        }

        // 7. Si se pasa parámetro "fix", aplicar correcciones
        if (process.argv[2] === 'fix') {
            console.log('\n🔧 APLICANDO CORRECCIONES...');
            
            // Obtener alumnos válidos con nivel 4
            const [alumnosValidos] = await connection.execute(`
                SELECT a.idAlumnos, u.nombre
                FROM alumnos a
                JOIN usuarios u ON a.idUsuarios = u.idUsuario
                WHERE u.idNivel = 4
                ORDER BY a.idAlumnos
            `);

            if (alumnosValidos.length === 0) {
                console.log('   ❌ No hay alumnos válidos con nivel 4 para corregir');
                return;
            }

            // Actualizar relaciones problemáticas
            let contador = 0;
            for (const problema of problemasRelaciones) {
                if (contador < alumnosValidos.length) {
                    const nuevoAlumno = alumnosValidos[contador];
                    
                    await connection.execute(`
                        UPDATE tutor 
                        SET idAlumno = ? 
                        WHERE idTutor = ?
                    `, [nuevoAlumno.idAlumnos, problema.idTutor]);

                    console.log(`   ✅ Tutor ${problema.idTutor}: ${problema.idAlumno} → ${nuevoAlumno.idAlumnos} (${nuevoAlumno.nombre})`);
                    contador++;
                }
            }

            console.log(`\n✅ CORRECCIÓN COMPLETADA: ${contador} relaciones actualizadas`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar función
fixTutorAlumnoRelations();