import { useAuth } from '../auth'
import { api } from '../api'
import { useEffect, useState } from 'react'

export default function Alumno() {
  const { token, user } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [calificaciones, setCalificaciones] = useState([])
  const [avisos, setAvisos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [talleres, setTalleres] = useState([])
  const [activeTab, setActiveTab] = useState('resumen')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [token, user])

  const getAlumnoId = () => (
    user?.idAlumno ?? user?.alumnoId ?? user?.alumno?.id ?? user?.id ?? null
  )
  const getUsuarioId = () => (
    user?.idUsuario ?? user?.usuarioId ?? user?.usuario?.id ?? null
  )

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')
    const alumnoId = getAlumnoId()
    const usuarioId = getUsuarioId()

    // Perfil por usuario (si hay usuarioId)
    if (usuarioId) {
      try {
        const perfilData = await api(`/api/alumnos/usuario/${usuarioId}`, { token })
        setPerfil(perfilData)
      } catch (e) {
        if (e.status !== 404) setError(prev => prev || (e.message || 'Error cargando perfil'))
      }
    } else {
      setPerfil(null)
    }

    // Datos por alumno (si hay alumnoId)
    if (alumnoId) {
      // Calificaciones (con fallback de ruta)
      try {
        const califData = await api(`/api/alumnos/${alumnoId}/calificaciones`, { token })
        setCalificaciones(califData || [])
      } catch (e) {
        if (e.status === 404) {
          try {
            const alt = await api(`/api/calificaciones/alumno/${alumnoId}`, { token })
            setCalificaciones(alt || [])
          } catch (e2) {
            if (e2.status === 404) setCalificaciones([])
            else setError(prev => prev || (e2.message || 'Error cargando calificaciones'))
          }
        } else {
          setError(prev => prev || (e.message || 'Error cargando calificaciones'))
        }
      }

      // Avisos (con fallback de ruta)
      try {
        const avisosData = await api(`/api/avisos/alumno/${alumnoId}`, { token })
        setAvisos(avisosData || [])
      } catch (e) {
        if (e.status === 404) {
          try {
            const alt = await api(`/api/alumnos/${alumnoId}/avisos`, { token })
            setAvisos(alt || [])
          } catch (e2) {
            if (e2.status === 404) setAvisos([])
            else setError(prev => prev || (e2.message || 'Error cargando avisos'))
          }
        } else {
          setError(prev => prev || (e.message || 'Error cargando avisos'))
        }
      }

      // Asistencias (con fallback de ruta)
      try {
        const asistData = await api(`/api/alumnos/${alumnoId}/asistencias`, { token })
        setAsistencias(asistData || [])
      } catch (e) {
        if (e.status === 404) {
          try {
            const alt = await api(`/api/asistencias/alumno/${alumnoId}`, { token })
            setAsistencias(alt || [])
          } catch (e2) {
            if (e2.status === 404) setAsistencias([])
            else setError(prev => prev || (e2.message || 'Error cargando asistencias'))
          }
        } else {
          setError(prev => prev || (e.message || 'Error cargando asistencias'))
        }
      }

      // Talleres (con fallback de ruta)
      try {
        const talleresData = await api(`/api/talleres/alumno/${alumnoId}`, { token })
        setTalleres(talleresData || [])
      } catch (e) {
        if (e.status === 404) {
          try {
            const alt = await api(`/api/alumnos/${alumnoId}/talleres`, { token })
            setTalleres(alt || [])
          } catch (e2) {
            if (e2.status === 404) setTalleres([])
            else setError(prev => prev || (e2.message || 'Error cargando talleres'))
          }
        } else {
          setError(prev => prev || (e.message || 'Error cargando talleres'))
        }
      }
    } else {
      // Si no hay alumnoId, limpiar listas para evitar llamadas con null/undefined
      setCalificaciones([])
      setAvisos([])
      setAsistencias([])
      setTalleres([])
    }

    setLoading(false)
  }

  const calcularPromedio = () => {
    if (calificaciones.length === 0) return 0
    const suma = calificaciones.reduce((acc, cal) => acc + cal.calificacion, 0)
    return (suma / calificaciones.length).toFixed(2)
  }

  const contarAsistencias = () => {
    const presentes = asistencias.filter(a => a.estado === 'presente').length
    const total = asistencias.length
    const porcentaje = total > 0 ? ((presentes / total) * 100).toFixed(1) : 0
    return { presentes, total, porcentaje }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con información del alumno */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mi Panel de Alumno</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {perfil && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h3 className="font-medium text-blue-800">Información Personal</h3>
                <p className="text-sm text-gray-700">
                  <strong>{perfil.nombre} {perfil.apellido}</strong>
                </p>
                <p className="text-sm text-gray-600">Matrícula: {perfil.matricula}</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Grupo</h4>
                <p className="text-sm text-gray-700">{perfil.nombreGrupo || 'No asignado'}</p>
                <p className="text-sm text-gray-600">Nivel: {perfil.nivel}</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Promedio General</h4>
                <p className="text-lg font-bold text-blue-600">{calcularPromedio()}</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Asistencia</h4>
                <p className="text-lg font-bold text-green-600">{contarAsistencias().porcentaje}%</p>
                <p className="text-xs text-gray-600">{contarAsistencias().presentes}/{contarAsistencias().total}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'resumen', name: 'Resumen' },
              { id: 'calificaciones', name: 'Calificaciones' },
              { id: 'asistencias', name: 'Asistencias' },
              { id: 'avisos', name: 'Avisos' },
              { id: 'talleres', name: 'Talleres' }
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
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Resumen Académico</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Calificaciones recientes */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Calificaciones Recientes</h4>
                <div className="space-y-2">
                  {calificaciones.slice(0, 4).map(cal => (
                    <div key={cal.idCalificacion} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{cal.materia}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        cal.calificacion >= 8 ? 'bg-green-100 text-green-800' :
                        cal.calificacion >= 7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cal.calificacion}
                      </span>
                    </div>
                  ))}
                  {calificaciones.length === 0 && (
                    <p className="text-sm text-gray-600">No hay calificaciones</p>
                  )}
                </div>
              </div>

              {/* Avisos importantes */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">Avisos Importantes</h4>
                <div className="space-y-2">
                  {avisos.slice(0, 3).map(aviso => (
                    <div key={aviso.idAviso} className="text-sm">
                      <div className="font-medium truncate">{aviso.titulo}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(aviso.fecha).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {avisos.length === 0 && (
                    <p className="text-sm text-gray-600">No hay avisos</p>
                  )}
                </div>
              </div>

              {/* Talleres inscritos */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Mis Talleres</h4>
                <div className="space-y-2">
                  {talleres.slice(0, 3).map(taller => (
                    <div key={taller.idTaller} className="text-sm">
                      <div className="font-medium">{taller.nombre}</div>
                      <div className="text-xs text-gray-600">{taller.horario}</div>
                    </div>
                  ))}
                  {talleres.length === 0 && (
                    <p className="text-sm text-gray-600">No hay talleres inscritos</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calificaciones' && (
          <div>
            <h3 className="text-lg font-bold mb-4">Mis Calificaciones</h3>
            <div className="mb-4">
              <span className="text-sm text-gray-600">Promedio general: </span>
              <span className="text-lg font-bold text-blue-600">{calcularPromedio()}</span>
            </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cal.materia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          cal.calificacion >= 8 ? 'bg-green-100 text-green-800' :
                          cal.calificacion >= 7 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
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
            <h3 className="text-lg font-bold mb-4">Mi Registro de Asistencias</h3>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-600">Presentes</div>
                <div className="text-xl font-bold text-green-800">{contarAsistencias().presentes}</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm text-red-600">Faltas</div>
                <div className="text-xl font-bold text-red-800">
                  {asistencias.filter(a => a.estado === 'ausente').length}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-600">Porcentaje Asistencia</div>
                <div className="text-xl font-bold text-blue-800">{contarAsistencias().porcentaje}%</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Entrada</th>
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          asistencia.estado === 'presente' ? 'bg-green-100 text-green-800' :
                          asistencia.estado === 'ausente' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {asistencia.estado === 'presente' ? 'Presente' :
                           asistencia.estado === 'ausente' ? 'Ausente' : 'Tarde'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asistencia.hora || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{asistencia.observaciones || '-'}</td>
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
                <div key={aviso.idAviso} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-lg">{aviso.titulo}</h4>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        aviso.tipo === 'urgente' ? 'bg-red-100 text-red-800' :
                        aviso.tipo === 'grupo' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {aviso.tipo}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(aviso.fecha).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{aviso.contenido}</p>
                </div>
              ))}
              {avisos.length === 0 && (
                <p className="text-center py-4 text-gray-600">No hay avisos disponibles</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'talleres' && (
          <div>
            <h3 className="text-lg font-bold mb-4">Mis Talleres</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {talleres.map(taller => (
                <div key={taller.idTaller} className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-2">{taller.nombre}</h4>
                  <p className="text-gray-700 text-sm mb-2">{taller.descripcion}</p>
                  <div className="text-sm text-gray-600">
                    <div><strong>Horario:</strong> {taller.horario}</div>
                    <div><strong>Profesor:</strong> {taller.profesor || 'No asignado'}</div>
                  </div>
                </div>
              ))}
              {talleres.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">No estás inscrito en ningún taller</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
