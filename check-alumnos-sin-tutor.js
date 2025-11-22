const mysql = require('mysql2/promise');

async function checkAlumnosSinTutor() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'mysql-escueladigital.mysql.database.azure.com',
            user: 'ale', 
            password: 'marianita.13.13',
            database: 'controlescolar'
        });

        console.log('🔍 VERIFICANDO ALUMNOS SIN TUTOR ASIGNADO\n');

        // 1. Ver todos los alumnos
        console.log('📚 TODOS LOS ALUMNOS:');
        const [todosAlumnos] = await connection.execute(`
            SELECT 
                a.idAlumnos,
                a.idUsuarios,
                u.nombre as nombreAlumno
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            WHERE u.idNivel = 4
            ORDER BY a.idAlumnos
        `);

        todosAlumnos.forEach(alumno => {
            console.log(`   idAlumnos:${alumno.idAlumnos} → Usuario:${alumno.idUsuarios} "${alumno.nombreAlumno}"`);
        });

        // 2. Ver alumnos con tutor asignado
        console.log('\n🔗 ALUMNOS CON TUTOR ASIGNADO:');
        const [alumnosConTutor] = await connection.execute(`
            SELECT 
                a.idAlumnos,
                a.idUsuarios,
                u.nombre as nombreAlumno,
                t.idTutor,
                ut.nombre as nombreTutor
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            JOIN tutor t ON a.idAlumnos = t.idAlumno
            JOIN usuarios ut ON t.idUsuario = ut.idUsuario
            WHERE u.idNivel = 4
            ORDER BY a.idAlumnos
        `);

        alumnosConTutor.forEach(alumno => {
            console.log(`   ✅ ${alumno.nombreAlumno} → Tutor: ${alumno.nombreTutor}`);
        });

        // 3. Identificar alumnos SIN tutor
        console.log('\n❌ ALUMNOS SIN TUTOR:');
        const [alumnosSinTutor] = await connection.execute(`
            SELECT 
                a.idAlumnos,
                a.idUsuarios,
                u.nombre as nombreAlumno
            FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            LEFT JOIN tutor t ON a.idAlumnos = t.idAlumno
            WHERE u.idNivel = 4 AND t.idAlumno IS NULL
            ORDER BY a.idAlumnos
        `);

        if (alumnosSinTutor.length === 0) {
            console.log('   ✅ Todos los alumnos tienen tutor asignado');
        } else {
            alumnosSinTutor.forEach(alumno => {
                console.log(`   ❌ ${alumno.nombreAlumno} (idAlumnos:${alumno.idAlumnos}, idUsuario:${alumno.idUsuarios})`);
            });
        }

        // 4. Ver tutores disponibles (usuarios tipo tutor)
        console.log('\n👥 TUTORES DISPONIBLES:');
        const [tutoresDisponibles] = await connection.execute(`
            SELECT 
                u.idUsuario,
                u.nombre,
                COUNT(t.idTutor) as alumnosAsignados
            FROM usuarios u
            LEFT JOIN tutor t ON u.idUsuario = t.idUsuario
            WHERE u.tipo_usuario = 'tutor' OR u.idNivel = 3
            GROUP BY u.idUsuario, u.nombre
            ORDER BY u.idUsuario
        `);

        tutoresDisponibles.forEach(tutor => {
            console.log(`   Tutor: ${tutor.nombre} (ID:${tutor.idUsuario}) → ${tutor.alumnosAsignados} alumno(s) asignado(s)`);
        });

        // 5. Si hay alumnos sin tutor, proponer solución
        if (alumnosSinTutor.length > 0) {
            console.log('\n🔧 PROPUESTA DE ASIGNACIÓN:');
            
            // Buscar tutores con menos alumnos asignados
            const [tutoresMenosOcupados] = await connection.execute(`
                SELECT 
                    u.idUsuario,
                    u.nombre,
                    COUNT(t.idTutor) as alumnosAsignados
                FROM usuarios u
                LEFT JOIN tutor t ON u.idUsuario = t.idUsuario
                WHERE u.tipo_usuario = 'tutor' OR u.idNivel = 3
                GROUP BY u.idUsuario, u.nombre
                ORDER BY alumnosAsignados ASC, u.idUsuario ASC
            `);

            for (let i = 0; i < alumnosSinTutor.length && i < tutoresMenosOcupados.length; i++) {
                const alumno = alumnosSinTutor[i];
                const tutor = tutoresMenosOcupados[i % tutoresMenosOcupados.length];
                
                console.log(`   📝 ${alumno.nombreAlumno} → Tutor: ${tutor.nombre}`);
            }

            console.log('\n❓ ¿Aplicar asignaciones automáticas?');
            console.log('   Ejecute: node check-alumnos-sin-tutor.js fix');
        }

        // 6. Aplicar correcciones si se solicita
        if (process.argv[2] === 'fix' && alumnosSinTutor.length > 0) {
            console.log('\n🔧 APLICANDO ASIGNACIONES...');
            
            const [tutoresMenosOcupados] = await connection.execute(`
                SELECT 
                    u.idUsuario,
                    u.nombre,
                    COUNT(t.idTutor) as alumnosAsignados
                FROM usuarios u
                LEFT JOIN tutor t ON u.idUsuario = t.idUsuario
                WHERE u.tipo_usuario = 'tutor' OR u.idNivel = 3
                GROUP BY u.idUsuario, u.nombre
                ORDER BY alumnosAsignados ASC, u.idUsuario ASC
            `);

            for (let i = 0; i < alumnosSinTutor.length; i++) {
                const alumno = alumnosSinTutor[i];
                const tutor = tutoresMenosOcupados[i % tutoresMenosOcupados.length];
                
                await connection.execute(`
                    INSERT INTO tutor (idUsuario, idAlumnos) 
                    VALUES (?, ?)
                `, [tutor.idUsuario, alumno.idAlumnos]);

                console.log(`   ✅ ${alumno.nombreAlumno} → Tutor: ${tutor.nombre}`);
            }

            console.log('\n✅ ASIGNACIONES COMPLETADAS');
        }

        // 7. Resumen final
        console.log('\n📊 RESUMEN:');
        const [resumenAlumnos] = await connection.execute(`
            SELECT COUNT(*) as total FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            WHERE u.idNivel = 4
        `);
        
        const [resumenConTutor] = await connection.execute(`
            SELECT COUNT(*) as conTutor FROM alumnos a
            JOIN usuarios u ON a.idUsuarios = u.idUsuario
            JOIN tutor t ON a.idAlumnos = t.idAlumno
            WHERE u.idNivel = 4
        `);

        const totalAlumnos = resumenAlumnos[0].total;
        const alumnosConTutorCount = resumenConTutor[0].conTutor;
        const alumnosSinTutorCount = totalAlumnos - alumnosConTutorCount;

        console.log(`   Total alumnos: ${totalAlumnos}`);
        console.log(`   Con tutor: ${alumnosConTutorCount}`);
        console.log(`   Sin tutor: ${alumnosSinTutorCount}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAlumnosSinTutor();