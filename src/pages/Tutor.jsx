import { useAuth } from '../auth'
import { api } from '../api'
import { useEffect, useState } from 'react'

export default function Tutor() {
  const { token, user } = useAuth()
  const [hijos, setHijos] = useState([])
  const [selectedHijo, setSelectedHijo] = useState(null)
  const [calificaciones, setCalificaciones] = useState([])
  const [avisos, setAvisos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHijos()
    loadNotificaciones()
  }, [token, user])

  useEffect(() => {
    if (selectedHijo) {
      loadHijoData()
    }
  }, [selectedHijo, activeTab])

  const loadHijos = async () => {
    try {
      setLoading(true)
      
      // Determinar ID del tutor - Siempre usar idUsuario para la consulta
      const tutorId = user?.idUsuario || user?.id
      console.log('Cargando alumnos para tutor ID:', tutorId)
      
      const data = await api(`/api/tutores/${tutorId}/alumnos`, { token })
      setHijos(data)
      if (data.length > 0) {
        setSelectedHijo(data[0])
      }
      setError('') // Limpiar errores previos
    } catch (e) {
      console.error('Error cargando alumnos:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadNotificaciones = async () => {
    try {
      const tutorId = user?.idUsuario || user?.id
      const data = await api(`/api/tutores/${tutorId}/notificaciones`, { token })
      setNotificaciones(data)
    } catch (e) {
      console.error('Error cargando notificaciones:', e)
      setNotificaciones([])
    }
  }

  const loadHijoData = async () => {
    if (!selectedHijo) return
    
    try {
      const promises = []
      
      if (activeTab === 'calificaciones' || activeTab === 'general') {
        promises.push(api(`/api/alumnos/${selectedHijo.idAlumno}/calificaciones`, { token }))
      } else {
        promises.push(Promise.resolve([]))
      }
      
      if (activeTab === 'avisos' || activeTab === 'general') {
        promises.push(api(`/api/avisos/alumno/${selectedHijo.idAlumno}`, { token }))
      } else {
        promises.push(Promise.resolve([]))
      }
      
      if (activeTab === 'asistencias' || activeTab === 'general') {
        promises.push(api(`/api/asistenciaqr/alumno/${selectedHijo.idAlumno}`, { token }))
      } else {
        promises.push(Promise.resolve([]))
      }

      const [califs, avis, asists] = await Promise.all(promises)
      
      setCalificaciones(califs)
      setAvisos(avis)
      setAsistencias(asists)
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!hijos.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Panel de Tutor</h2>
        <p className="text-gray-600">No se encontraron alumnos asociados a este tutor.</p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Panel de Tutor</h2>
        
        {/* Selector de hijo */}
        {/* Si solo hay un hijo, no mostramos el selector */}
        {hijos.length === 1 ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Alumno: {hijos[0].nombre} {hijos[0].apellido}
            </h3>
            <p className="text-sm text-gray-600">Matrícula: {hijos[0].matricula}</p>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar alumno:
            </label>
            <select
              value={selectedHijo?.idAlumno || ''}
              onChange={(e) => {
                const hijo = hijos.find(h => h.idAlumno === parseInt(e.target.value))
                setSelectedHijo(hijo)
              }}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {hijos.map(hijo => (
                <option key={hijo.idAlumno} value={hijo.idAlumno}>
                  {hijo.nombre} {hijo.apellido} - {hijo.matricula}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {selectedHijo && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">
              Información de {selectedHijo.nombre} {selectedHijo.apellido}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><strong>Matrícula:</strong> {selectedHijo.matricula}</div>
              <div><strong>Grupo:</strong> {selectedHijo.nombreGrupo || 'No asignado'}</div>
              <div><strong>Nivel:</strong> {selectedHijo.nivel || 'No especificado'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'general', name: 'Resumen General' },
              { id: 'calificaciones', name: 'Calificaciones' },
              { id: 'asistencias', name: 'Asistencias' },
              { id: 'avisos', name: 'Avisos' },
              { id: 'notificaciones', name: `Notificaciones ${notificaciones.length > 0 ? `(${notificaciones.length})` : ''}` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Resumen General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Calificaciones Recientes</h4>
                {calificaciones.slice(0, 3).map(cal => (
                  <div key={cal.idCalificacion} className="text-sm mb-1">
                    <span className="font-medium">{cal.materia}:</span> {cal.calificacion}
                  </div>
                ))}
                {calificaciones.length === 0 && (
                  <p className="text-sm text-gray-600">No hay calificaciones</p>
                )}
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Asistencias</h4>
                <div className="text-sm space-y-2">
                  {/* Asistencia del día */}
                  {asistencias.length > 0 && asistencias[0] && (
                    <div className="border-b pb-2">
                      <div className="font-medium">Hoy:</div>
                      <div className={`mt-1 inline-block px-2 py-1 rounded text-xs ${
                        asistencias[0].estado === 'presente' ? 'bg-green-100 text-green-800' :
                        asistencias[0].estado === 'tarde' ? 'bg-yellow-100 text-yellow-800' :
                        asistencias[0].estado === 'pendiente' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asistencias[0].estado === 'presente' ? '✓ Presente' :
                         asistencias[0].estado === 'tarde' ? '⚠ Tarde' :
                         asistencias[0].estado === 'pendiente' ? '⏳ Pendiente' :
                         '✕ Ausente'}
                      </div>
                      {asistencias[0].hora && (
                        <div className="text-xs text-gray-600 mt-1">
                          Hora: {asistencias[0].hora}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Resumen de la semana */}
                  <div>
                    <div className="font-medium mb-1">Últimos 7 días:</div>
                    <div>Presentes: {asistencias.filter(a => a.estado === 'presente').length}</div>
                    <div>Faltas: {asistencias.filter(a => a.estado === 'ausente').length}</div>
                    <div>Tardanzas: {asistencias.filter(a => a.estado === 'tarde').length}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Avisos Recientes</h4>
                {avisos.slice(0, 2).map(aviso => (
                  <div key={aviso.idAviso} className="text-sm mb-2">
                    <div className="font-medium">{aviso.titulo}</div>
                    <div className="text-gray-600">{new Date(aviso.fecha).toLocaleDateString()}</div>
                  </div>
                ))}
                {avisos.length === 0 && (
                  <p className="text-sm text-gray-600">No hay avisos</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calificaciones' && (
          <div>
            <h3 className="text-lg font-bold mb-4">Calificaciones</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calificaciones.map(cal => (
                    <tr key={cal.idCalificacion}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cal.materia}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded ${cal.calificacion >= 7 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {cal.calificacion}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cal.periodo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(cal.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{cal.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {calificaciones.length === 0 && (
                <p className="text-center py-4 text-gray-600">No hay calificaciones registradas</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'asistencias' && (
          <div>
            <h3 className="text-lg font-bold mb-4">Registro de Asistencias</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {asistencias.map((asistencia, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(asistencia.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-xs ${
                          asistencia.estado === 'presente' ? 'bg-green-100 text-green-800' :
                          asistencia.estado === 'ausente' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {asistencia.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asistencia.hora}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{asistencia.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {asistencias.length === 0 && (
                <p className="text-center py-4 text-gray-600">No hay registros de asistencia</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'avisos' && (
          <div>
            <h3 className="text-lg font-bold mb-4">Avisos y Notificaciones</h3>
            <div className="space-y-4">
              {avisos.map(aviso => (
                <div key={aviso.idAviso} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-lg">{aviso.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      aviso.tipo === 'urgente' ? 'bg-red-100 text-red-800' :
                      aviso.tipo === 'grupo' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {aviso.tipo}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{aviso.contenido}</p>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(aviso.fecha).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {avisos.length === 0 && (
                <p className="text-center py-4 text-gray-600">No hay avisos disponibles</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notificaciones' && (
          <div>
            <h3 className="text-lg font-bold mb-4">Notificaciones de Asistencia</h3>
            <div className="space-y-3">
              {notificaciones.map(notif => (
                <div key={notif.idNotificacion} className="border rounded-lg p-4 bg-white hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        notif.tipoMovimiento === 'entrada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {notif.tipoMovimiento === 'entrada' ? '🟢 Entrada' : '🔵 Salida'}
                      </span>
                      <span className="font-medium">
                        {notif.alumnoNombre} {notif.alumnoApellido}
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(notif.fechaEnvio).toLocaleDateString()}</div>
                      <div>{new Date(notif.fechaEnvio).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{notif.mensaje}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                      notif.estadoEnvio === 'enviado' ? 'bg-green-50 text-green-600' :
                      notif.estadoEnvio === 'pendiente' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {notif.metodoEnvio} - {notif.estadoEnvio}
                    </span>
                  </div>
                </div>
              ))}
              {notificaciones.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🔔</div>
                  <p className="text-gray-600">No hay notificaciones de asistencia aún</p>
                  <p className="text-sm text-gray-500 mt-1">Las notificaciones aparecerán cuando los alumnos escaneen su código QR</p>
                </div>
              )}
            </div>
            {notificaciones.length > 0 && (
              <div className="mt-6 text-center">
                <button 
                  onClick={loadNotificaciones}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  🔄 Actualizar notificaciones
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
