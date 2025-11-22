const mysql = require('mysql2/promise');

async function fixTutorFinal() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'mysql-escueladigital.mysql.database.azure.com',
            user: 'ale', 
            password: 'marianita.13.13',
            database: 'controlescolar'
        });

        console.log('🔍 DIAGNÓSTICO COMPLETO DE RELACIONES TUTOR-ALUMNO\n');

        // 1. Ver TODA la tabla tutor con detalles completos
        console.log('📋 TABLA TUTOR COMPLETA:');
        const [tutorTable] = await connection.execute(`
            SELECT 
                t.idTutor,
                t.idUsuario as tutorIdUsuario,
                ut.nombre as tutorNombre,
                ut.idNivel as tutorNivel,
                t.idAlumno,
                -- Buscar en alumnos
                a.idUsuarios as alumnoIdUsuarios,
                ua.nombre as alumnoNombre,
                ua.idNivel as alumnoNivel,
                ua.tipo_usuario as alumnoTipo
            FROM tutor t
            LEFT JOIN usuarios ut ON t.idUsuario = ut.idUsuario
            LEFT JOIN alumnos a ON t.idAlumno = a.idAlumnos
            LEFT JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
            ORDER BY t.idTutor
        `);

        tutorTable.forEach(row => {
            console.log(`   ${row.idTutor}: Tutor "${row.tutorNombre}" (ID:${row.tutorIdUsuario}) → idAlumno:${row.idAlumno}`);
            if (row.alumnoNombre) {
                console.log(`      └─ Alumno: "${row.alumnoNombre}" (Usuario:${row.alumnoIdUsuarios}, Nivel:${row.alumnoNivel}, Tipo:${row.alumnoTipo})`);
            } else {
                console.log(`      └─ ❌ idAlumno ${row.idAlumno} NO EXISTE en tabla alumnos`);
            }
        });

        // 2. Verificar si hay idAlumno que no corresponden a nivel 4
        console.log('\n🚨 PROBLEMAS DETECTADOS:');
        const [problemas] = await connection.execute(`
            SELECT 
                t.idTutor,
                t.idAlumno,
                CASE 
                    WHEN a.idAlumnos IS NULL THEN 'idAlumno no existe en tabla alumnos'
                    WHEN ua.idNivel != 4 THEN CONCAT('Alumno tiene nivel ', ua.idNivel, ' en lugar de nivel 4')
                    ELSE 'OK'
                END as problema,
                ua.nombre as nombreUsuario,
                ua.idNivel as nivelUsuario
            FROM tutor t
            LEFT JOIN alumnos a ON t.idAlumno = a.idAlumnos
            LEFT JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
            WHERE a.idAlumnos IS NULL OR ua.idNivel != 4
        `);

        if (problemas.length === 0) {
            console.log('   ✅ No se encontraron problemas');
        } else {
            problemas.forEach(problema => {
                console.log(`   ❌ idTutor:${problema.idTutor} → idAlumno:${problema.idAlumno}`);
                console.log(`      Problema: ${problema.problema}`);
                if (problema.nombreUsuario) {
                    console.log(`      Usuario vinculado: ${problema.nombreUsuario} (Nivel: ${problema.nivelUsuario})`);
                }
            });
        }

        // 3. Mostrar alumnos válidos disponibles
        console.log('\n📚 ALUMNOS VÁLIDOS DISPONIBLES (Nivel 4):');
        const [alumnosValidos] = await connection.execute(`
            SELECT 
                a.idAlumnos,
                a.idUsuarios,
                u.nombre,
                u.idNivel,
                -- Verificar si ya está asignado
                COUNT(t.idAlumno) as yaAsignado
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            LEFT JOIN tutor t ON a.idAlumnos = t.idAlumno
            WHERE u.idNivel = 4
            GROUP BY a.idAlumnos, a.idUsuarios, u.nombre, u.idNivel
            ORDER BY a.idAlumnos
        `);

        alumnosValidos.forEach(alumno => {
            const status = alumno.yaAsignado > 0 ? '🔗 YA ASIGNADO' : '✅ DISPONIBLE';
            console.log(`   idAlumnos:${alumno.idAlumnos} → Usuario:${alumno.idUsuarios} "${alumno.nombre}" (${status})`);
        });

        // 4. Si hay problemas, ofrecer corrección
        if (problemas.length > 0) {
            console.log('\n🔧 APLICANDO CORRECCIÓN AUTOMÁTICA...');
            
            // Obtener alumnos no asignados
            const [alumnosLibres] = await connection.execute(`
                SELECT 
                    a.idAlumnos,
                    u.nombre
                FROM alumnos a
                JOIN usuarios u ON a.idUsuarios = u.idUsuario
                LEFT JOIN tutor t ON a.idAlumnos = t.idAlumno
                WHERE u.idNivel = 4 AND t.idAlumno IS NULL
                ORDER BY a.idAlumnos
                LIMIT ${problemas.length}
            `);

            if (alumnosLibres.length === 0) {
                console.log('   ⚠️ No hay alumnos libres disponibles');
                
                // En este caso, usar cualquier alumno válido (puede haber duplicados)
                const [cualquierAlumno] = await connection.execute(`
                    SELECT a.idAlumnos, u.nombre
                    FROM alumnos a
                    JOIN usuarios u ON a.idUsuarios = u.idUsuario
                    WHERE u.idNivel = 4
                    ORDER BY a.idAlumnos
                    LIMIT 1
                `);

                if (cualquierAlumno.length > 0) {
                    for (const problema of problemas) {
                        await connection.execute(`
                            UPDATE tutor 
                            SET idAlumno = ? 
                            WHERE idTutor = ?
                        `, [cualquierAlumno[0].idAlumnos, problema.idTutor]);

                        console.log(`   ✅ Tutor ${problema.idTutor}: ${problema.idAlumno} → ${cualquierAlumno[0].idAlumnos} (${cualquierAlumno[0].nombre})`);
                    }
                }
            } else {
                // Asignar alumnos libres
                for (let i = 0; i < problemas.length && i < alumnosLibres.length; i++) {
                    const problema = problemas[i];
                    const alumnoLibre = alumnosLibres[i];
                    
                    await connection.execute(`
                        UPDATE tutor 
                        SET idAlumno = ? 
                        WHERE idTutor = ?
                    `, [alumnoLibre.idAlumnos, problema.idTutor]);

                    console.log(`   ✅ Tutor ${problema.idTutor}: ${problema.idAlumno} → ${alumnoLibre.idAlumnos} (${alumnoLibre.nombre})`);
                }
            }

            console.log('\n✅ CORRECCIÓN COMPLETADA');
        }

        // 5. Verificación final
        console.log('\n🔍 VERIFICACIÓN FINAL:');
        const [verificacionFinal] = await connection.execute(`
            SELECT 
                t.idTutor,
                ut.nombre as tutorNombre,
                ua.nombre as alumnoNombre,
                ua.idNivel as alumnoNivel
            FROM tutor t
            JOIN usuarios ut ON t.idUsuario = ut.idUsuario
            JOIN alumnos a ON t.idAlumno = a.idAlumnos
            JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
            ORDER BY t.idTutor
        `);

        verificacionFinal.forEach(row => {
            const status = row.alumnoNivel === 4 ? '✅' : '❌';
            console.log(`   ${status} ${row.tutorNombre} → ${row.alumnoNombre} (Nivel: ${row.alumnoNivel})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixTutorFinal();