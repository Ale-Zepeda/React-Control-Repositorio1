const axios = require('axios').default;

async function testCompleteQRSystem() {
  console.log('🧪 Probando sistema QR completo...\n');

  const baseURL = 'http://localhost:4000/api';

  try {
    // 1. Generar QR para alumno ID 3 (Juan Pérez)
    console.log('1️⃣ Generando QR para alumno...');
    const qrResponse = await axios.post(`${baseURL}/qr/generar`, {
      idAlumnos: 3
    });

    console.log('✅ QR generado:');
    console.log(`   Código: ${qrResponse.data.codigoQR}`);
    console.log(`   ID en BD: ${qrResponse.data.idQR}`);
    
    const codigoQR = qrResponse.data.codigoQR;

    // 2. Simular escaneo de entrada
    console.log('\n2️⃣ Simulando escaneo de ENTRADA...');
    const entradaResponse = await axios.post(`${baseURL}/qr/escanear`, {
      codigoQR: codigoQR,
      tipoMovimiento: 'entrada',
      dispositivo: 'Scanner-Test-01',
      ubicacion: 'Puerta Principal'
    });

    console.log('✅ Entrada registrada:');
    console.log(`   Alumno: ${entradaResponse.data.alumno}`);
    console.log(`   Hora: ${entradaResponse.data.hora}`);
    console.log(`   Tutor: ${entradaResponse.data.tutor || 'Sin tutor'}`);
    console.log(`   ID Asistencia: ${entradaResponse.data.asistenciaId}`);

    // 3. Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Simular escaneo de salida
    console.log('\n3️⃣ Simulando escaneo de SALIDA...');
    const salidaResponse = await axios.post(`${baseURL}/qr/escanear`, {
      codigoQR: codigoQR,
      tipoMovimiento: 'salida',
      dispositivo: 'Scanner-Test-01',
      ubicacion: 'Puerta Principal'
    });

    console.log('✅ Salida registrada:');
    console.log(`   Alumno: ${salidaResponse.data.alumno}`);
    console.log(`   Hora: ${salidaResponse.data.hora}`);
    console.log(`   ID Asistencia: ${salidaResponse.data.asistenciaId}`);

    // 5. Obtener estadísticas del día
    console.log('\n4️⃣ Consultando estadísticas del día...');
    const today = new Date().toISOString().split('T')[0];
    const statsResponse = await axios.get(`${baseURL}/qr/asistencias/dia/${today}`);

    console.log('📊 Estadísticas del día:');
    console.log(`   Total registros: ${statsResponse.data.total}`);
    console.log(`   Entradas: ${statsResponse.data.entradas}`);
    console.log(`   Salidas: ${statsResponse.data.salidas}`);
    console.log(`   En la escuela: ${statsResponse.data.entradas - statsResponse.data.salidas}`);

    // 6. Mostrar últimos movimientos
    console.log('\n📋 Últimos movimientos:');
    statsResponse.data.registros.slice(0, 5).forEach(reg => {
      const emoji = reg.tipoMovimiento === 'entrada' ? '🟢' : '🔵';
      const hora = new Date(reg.fechaHora).toLocaleTimeString();
      console.log(`   ${emoji} ${reg.nombreAlumno} ${reg.apellidoAlumno} - ${hora}`);
    });

    // 7. Obtener QR del alumno
    console.log('\n5️⃣ Consultando QR del alumno...');
    const qrAlumnoResponse = await axios.get(`${baseURL}/qr/alumno/3`);
    
    console.log('✅ QR del alumno:');
    console.log(`   Código: ${qrAlumnoResponse.data.codigoQR}`);
    console.log(`   Activo: ${qrAlumnoResponse.data.activo ? 'Sí' : 'No'}`);
    console.log(`   Tamaño imagen: ${qrAlumnoResponse.data.qrImage ? qrAlumnoResponse.data.qrImage.length : 0} caracteres`);

    console.log('\n🎉 ¡Sistema QR funcionando perfectamente!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

// Solo ejecutar si tenemos axios disponible
if (typeof require !== 'undefined') {
  try {
    testCompleteQRSystem();
  } catch (e) {
    console.log('⚠️  axios no disponible, instalando...');
    console.log('npm install axios');
  }
} else {
  testCompleteQRSystem();
}