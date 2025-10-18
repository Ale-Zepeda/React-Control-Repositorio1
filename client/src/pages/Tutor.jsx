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
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHijos()
  }, [token, user])

  useEffect(() => {
    if (selectedHijo) {
      loadHijoData()
    }
  }, [selectedHijo, activeTab])

  const loadHijos = async () => {
    try {
      setLoading(true)
      const data = await api(`/api/tutores/${user?.idTutor || user?.idUsuario}/alumnos`, { token })
      setHijos(data)
      if (data.length > 0) {
        setSelectedHijo(data[0])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
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
        promises.push(api(`/api/alumnos/${selectedHijo.idAlumno}/asistencias`, { token }))
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
              { id: 'avisos', name: 'Avisos' }
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
                <div className="text-sm">
                  <div>Presentes: {asistencias.filter(a => a.estado === 'presente').length}</div>
                  <div>Faltas: {asistencias.filter(a => a.estado === 'ausente').length}</div>
                  <div>Tardanzas: {asistencias.filter(a => a.estado === 'tarde').length}</div>
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
      </div>
    </div>
  )
}
