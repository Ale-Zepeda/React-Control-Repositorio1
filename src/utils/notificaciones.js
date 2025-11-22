// Sistema de notificaciones gratuitas
// Usando EmailJS para emails gratuitos

const EMAILJS_CONFIG = {
  serviceId: 'gmail', // Configurar con EmailJS
  templateId: 'template_asistencia',
  publicKey: 'tu_public_key'
}

// Inicializar EmailJS
export const initNotificaciones = () => {
  // Solo cargar EmailJS si está disponible
  if (typeof window !== 'undefined' && window.emailjs) {
    window.emailjs.init(EMAILJS_CONFIG.publicKey)
  }
}

// Enviar notificación de entrada/salida
export const enviarNotificacionAsistencia = async (alumno, tutor, tipoMovimiento) => {
  try {
    const mensaje = generarMensaje(alumno, tipoMovimiento)
    
    // 1. Intentar email (gratis con EmailJS)
    await enviarEmail(tutor, alumno, tipoMovimiento, mensaje)
    
    // 2. Intentar notificación push del navegador
    await enviarNotificacionPush(mensaje)
    
    // 3. Guardar en base de datos local
    guardarNotificacionLocal(alumno, tutor, tipoMovimiento, mensaje)
    
    return { success: true, metodos: ['email', 'push', 'local'] }
    
  } catch (error) {
    console.error('Error enviando notificaciones:', error)
    return { success: false, error: error.message }
  }
}

// Generar mensaje de notificación
const generarMensaje = (alumno, tipoMovimiento) => {
  const fecha = new Date()
  const hora = fecha.toLocaleTimeString()
  const fechaStr = fecha.toLocaleDateString()
  
  const emoji = tipoMovimiento === 'entrada' ? '🟢' : '🔵'
  const accion = tipoMovimiento === 'entrada' ? 'ingresó' : 'salió'
  
  return {
    subject: `${emoji} ${alumno.nombre} - ${tipoMovimiento} registrada`,
    text: `Estimado tutor,\n\n${alumno.nombre} ${alumno.apellido} ${accion} de la escuela el ${fechaStr} a las ${hora}.\n\nEste es un mensaje automático del sistema de control escolar.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">${emoji} Control Escolar</h2>
        </div>
        
        <div style="background: ${tipoMovimiento === 'entrada' ? '#e8f5e8' : '#e8f0ff'}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">
            ${tipoMovimiento === 'entrada' ? 'Entrada registrada' : 'Salida registrada'}
          </h3>
          <p style="margin: 5px 0; color: #555;"><strong>Alumno:</strong> ${alumno.nombre} ${alumno.apellido}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Fecha:</strong> ${fechaStr}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Hora:</strong> ${hora}</p>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin: 15px 0;">
          Este es un mensaje automático del sistema de control escolar.
        </p>
      </div>
    `
  }
}

// Enviar email usando EmailJS (gratis)
const enviarEmail = async (tutor, alumno, tipoMovimiento, mensaje) => {
  if (typeof window === 'undefined' || !window.emailjs) {
    throw new Error('EmailJS no disponible')
  }
  
  const templateParams = {
    to_email: tutor.email,
    to_name: `${tutor.nombre} ${tutor.apellido}`,
    alumno_nombre: `${alumno.nombre} ${alumno.apellido}`,
    tipo_movimiento: tipoMovimiento,
    fecha_hora: new Date().toLocaleString(),
    subject: mensaje.subject,
    html_content: mensaje.html
  }
  
  const response = await window.emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateId,
    templateParams
  )
  
  if (response.status !== 200) {
    throw new Error('Error enviando email')
  }
  
  return response
}

// Enviar notificación push del navegador
const enviarNotificacionPush = async (mensaje) => {
  if (!('Notification' in window)) {
    return false
  }
  
  // Solicitar permiso si es necesario
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return false
    }
  }
  
  if (Notification.permission === 'granted') {
    new Notification(mensaje.subject, {
      body: mensaje.text,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    })
    return true
  }
  
  return false
}

// Guardar notificación en localStorage como respaldo
const guardarNotificacionLocal = (alumno, tutor, tipoMovimiento, mensaje) => {
  try {
    const notificacion = {
      id: Date.now(),
      idAlumno: alumno.idAlumno,
      idTutor: tutor.idTutor,
      tipoMovimiento,
      mensaje: mensaje.subject,
      fechaHora: new Date().toISOString(),
      leida: false
    }
    
    const notificaciones = JSON.parse(localStorage.getItem('notificaciones_pendientes') || '[]')
    notificaciones.push(notificacion)
    
    // Mantener solo las últimas 50 notificaciones
    if (notificaciones.length > 50) {
      notificaciones.splice(0, notificaciones.length - 50)
    }
    
    localStorage.setItem('notificaciones_pendientes', JSON.stringify(notificaciones))
  } catch (error) {
    console.error('Error guardando notificación local:', error)
  }
}

// Obtener notificaciones pendientes
export const obtenerNotificacionesPendientes = () => {
  try {
    return JSON.parse(localStorage.getItem('notificaciones_pendientes') || '[]')
  } catch (error) {
    return []
  }
}

// Marcar notificaciones como leídas
export const marcarNotificacionesLeidas = (ids = []) => {
  try {
    const notificaciones = obtenerNotificacionesPendientes()
    
    notificaciones.forEach(notif => {
      if (ids.length === 0 || ids.includes(notif.id)) {
        notif.leida = true
      }
    })
    
    localStorage.setItem('notificaciones_pendientes', JSON.stringify(notificaciones))
  } catch (error) {
    console.error('Error marcando notificaciones:', error)
  }
}

// Configuración alternativa para WhatsApp Web (sin costo)
export const abrirWhatsApp = (telefono, mensaje) => {
  const mensajeEncoded = encodeURIComponent(mensaje)
  const url = `https://wa.me/${telefono}?text=${mensajeEncoded}`
  window.open(url, '_blank')
}

// Sistema de notificaciones automáticas del navegador
export const configurarNotificacionesAutomaticas = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado:', registration)
      })
      .catch(error => {
        console.log('Error registrando Service Worker:', error)
      })
  }
}

export default {
  initNotificaciones,
  enviarNotificacionAsistencia,
  obtenerNotificacionesPendientes,
  marcarNotificacionesLeidas,
  abrirWhatsApp,
  configurarNotificacionesAutomaticas
}