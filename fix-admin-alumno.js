const mysql = require('mysql2/promise');

async function fixAdminInAlumnos() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'mysql-escueladigital.mysql.database.azure.com',
            user: 'ale', 
            password: 'marianita.13.13',
            database: 'controlescolar'
        });

        console.log('🔍 VERIFICANDO PROBLEMA: ADMINISTRADOR EN TABLA ALUMNOS\n');

        // 1. Verificar tabla alumnos completa
        console.log('📋 TABLA ALUMNOS COMPLETA:');
        const [alumnosTable] = await connection.execute(`
            SELECT 
                a.idAlumnos,
                a.idUsuarios,
                u.nombre,
                u.idNivel,
                u.tipo_usuario,
                n.nivel as nivelNombre
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            JOIN nivel n ON u.idNivel = n.idNivel
            ORDER BY a.idAlumnos
        `);

        alumnosTable.forEach(alumno => {
            const status = alumno.idNivel === 4 ? '✅' : '❌';
            console.log(`   ${status} idAlumnos:${alumno.idAlumnos} → Usuario:${alumno.idUsuarios} "${alumno.nombre}"`);
            console.log(`      Nivel: ${alumno.idNivel} (${alumno.nivelNombre}), Tipo: ${alumno.tipo_usuario}`);
        });

        // 2. Identificar administradores en tabla alumnos
        console.log('\n🚨 ADMINISTRADORES EN TABLA ALUMNOS (PROBLEMA):');
        const [adminsInAlumnos] = await connection.execute(`
            SELECT 
                a.idAlumnos,
                a.idUsuarios,
                u.nombre,
                u.tipo_usuario,
                u.idNivel
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            WHERE u.idNivel = 1 OR u.tipo_usuario = 'admin'
        `);

        if (adminsInAlumnos.length === 0) {
            console.log('   ✅ No hay administradores en tabla alumnos');
        } else {
            adminsInAlumnos.forEach(admin => {
                console.log(`   ❌ idAlumnos:${admin.idAlumnos} → "${admin.nombre}" (Admin, Nivel:${admin.idNivel})`);
            });
        }

        // 3. Verificar si hay tutores vinculados a estos administradores
        console.log('\n🔗 TUTORES VINCULADOS A ADMINISTRADORES:');
        const [tutoresVinculados] = await connection.execute(`
            SELECT 
                t.idTutor,
                t.idAlumno,
                ut.nombre as tutorNombre,
                ua.nombre as adminNombre
            FROM tutor t
            JOIN usuarios ut ON t.idUsuario = ut.idUsuario
            JOIN alumnos a ON t.idAlumno = a.idAlumnos
            JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
            WHERE ua.idNivel = 1 OR ua.tipo_usuario = 'admin'
        `);

        if (tutoresVinculados.length === 0) {
            console.log('   ✅ No hay tutores vinculados a administradores');
        } else {
            tutoresVinculados.forEach(vinculo => {
                console.log(`   ❌ Tutor "${vinculo.tutorNombre}" → Admin "${vinculo.adminNombre}" (idAlumno:${vinculo.idAlumno})`);
            });
        }

        // 4. Aplicar correcciones
        if (adminsInAlumnos.length > 0) {
            console.log('\n🔧 APLICANDO CORRECCIONES...');
            
            // Primero, reasignar tutores si es necesario
            if (tutoresVinculados.length > 0) {
                console.log('\n   📝 Reasignando tutores a alumnos válidos...');
                
                const [alumnosValidos] = await connection.execute(`
                    SELECT a.idAlumnos, u.nombre
                    FROM alumnos a
                    JOIN usuarios u ON a.idUsuarios = u.idUsuario
                    WHERE u.idNivel = 4
                    ORDER BY a.idAlumnos
                `);

                for (let i = 0; i < tutoresVinculados.length && i < alumnosValidos.length; i++) {
                    const tutor = tutoresVinculados[i];
                    const alumnoValido = alumnosValidos[i];
                    
                    await connection.execute(`
                        UPDATE tutor 
                        SET idAlumno = ? 
                        WHERE idTutor = ?
                    `, [alumnoValido.idAlumnos, tutor.idTutor]);

                    console.log(`      ✅ Tutor "${tutor.tutorNombre}": ${tutor.idAlumno} → ${alumnoValido.idAlumnos} (${alumnoValido.nombre})`);
                }
            }

            // Segundo, eliminar administradores de tabla alumnos
            console.log('\n   🗑️ Eliminando administradores de tabla alumnos...');
            for (const admin of adminsInAlumnos) {
                await connection.execute(`
                    DELETE FROM alumnos WHERE idAlumnos = ?
                `, [admin.idAlumnos]);

                console.log(`      ✅ Eliminado: idAlumnos:${admin.idAlumnos} "${admin.nombre}"`);
            }

            console.log('\n✅ CORRECCIONES COMPLETADAS');
        }

        // 5. Verificación final
        console.log('\n🔍 VERIFICACIÓN FINAL:');
        
        // Verificar que no hay admins en alumnos
        const [verificacionAlumnos] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            WHERE u.idNivel = 1 OR u.tipo_usuario = 'admin'
        `);

        if (verificacionAlumnos[0].count === 0) {
            console.log('   ✅ No hay administradores en tabla alumnos');
        } else {
            console.log(`   ❌ Aún hay ${verificacionAlumnos[0].count} administradores en tabla alumnos`);
        }

        // Verificar que todos los tutores están vinculados a alumnos válidos
        const [verificacionTutores] = await connection.execute(`
            SELECT 
                t.idTutor,
                ut.nombre as tutorNombre,
                ua.nombre as alumnoNombre,
                ua.idNivel
            FROM tutor t
            JOIN usuarios ut ON t.idUsuario = ut.idUsuario
            JOIN alumnos a ON t.idAlumno = a.idAlumnos
            JOIN usuarios ua ON a.idUsuarios = ua.idUsuario
            ORDER BY t.idTutor
        `);

        console.log('\n   📋 RELACIONES TUTOR → ALUMNO:');
        verificacionTutores.forEach(rel => {
            const status = rel.idNivel === 4 ? '✅' : '❌';
            console.log(`      ${status} ${rel.tutorNombre} → ${rel.alumnoNombre} (Nivel: ${rel.idNivel})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixAdminInAlumnos();