import { useAuth } from '../auth'
import { api } from '../api'
import { useEffect, useState } from 'react'

export default function Profesor() {
  const { token, user } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [selectedGrupo, setSelectedGrupo] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [calificaciones, setCalificaciones] = useState([])
  const [materias, setMaterias] = useState([])
  const [avisos, setAvisos] = useState([])
  const [activeTab, setActiveTab] = useState('grupos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCalifModal, setShowCalifModal] = useState(false)
  const [showAvisoModal, setShowAvisoModal] = useState(false)
  const [calificacionForm, setCalificacionForm] = useState({
    idAlumno: '',
    idMateria: '',
    calificacion: '',
    periodo: '',
    observaciones: ''
  })
  const [avisoForm, setAvisoForm] = useState({
    titulo: '',
    contenido: '',
    tipo: 'grupo',
    idGrupo: ''
  })

  useEffect(() => {
    loadProfesorData()
  }, [token, user])

  useEffect(() => {
    if (selectedGrupo && activeTab !== 'grupos') {
      loadGrupoData()
    }
  }, [selectedGrupo, activeTab])

  const loadProfesorData = async () => {
    try {
      setLoading(true)
      const [gruposData, materiasData] = await Promise.all([
        api(`/api/profesores/${user?.idProfesor || user?.idUsuario}/grupos`, { token }),
        api(`/api/materias/profesor/${user?.idProfesor || user?.idUsuario}`, { token })
      ])
      
      setGrupos(gruposData)
      setMaterias(materiasData)
      
      if (gruposData.length > 0) {
        setSelectedGrupo(gruposData[0])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadGrupoData = async () => {
    if (!selectedGrupo) return
    
    try {
      const promises = []
      
      if (activeTab === 'alumnos' || activeTab === 'calificaciones') {
        promises.push(api(`/api/grupos/${selectedGrupo.idGrupo}/alumnos`, { token }))
      } else {
        promises.push(Promise.resolve([]))
      }
      
      if (activeTab === 'calificaciones') {
        promises.push(api(`/api/grupos/${selectedGrupo.idGrupo}/calificaciones`, { token }))
      } else {
        promises.push(Promise.resolve([]))
      }
      
      if (activeTab === 'avisos') {
        promises.push(api(`/api/avisos/grupo/${selectedGrupo.idGrupo}`, { token }))
      } else {
        promises.push(Promise.resolve([]))
      }

      const [alumnosData, califData, avisosData] = await Promise.all(promises)
      
      setAlumnos(alumnosData)
      setCalificaciones(califData)
      setAvisos(avisosData)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleCalificacionSubmit = async (e) => {
    e.preventDefault()
    try {
      await api('/api/calificaciones', {
        method: 'POST',
        body: {
          ...calificacionForm,
          fecha: new Date().toISOString().split('T')[0]
        },
        token
      })
      setShowCalifModal(false)
      setCalificacionForm({
        idAlumno: '',
        idMateria: '',
        calificacion: '',
        periodo: '',
        observaciones: ''
      })
      loadGrupoData()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleAvisoSubmit = async (e) => {
    e.preventDefault()
    try {
      await api('/api/avisos', {
        method: 'POST',
        body: {
          ...avisoForm,
          fecha: new Date().toISOString().split('T')[0],
          idUsuario: user?.idUsuario
        },
        token
      })
      setShowAvisoModal(false)
      setAvisoForm({
        titulo: '',
        contenido: '',
        tipo: 'grupo',
        idGrupo: ''
      })
      loadGrupoData()
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

  if (!grupos.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Panel de Profesor</h2>
        <p className="text-gray-600">No se encontraron grupos asignados a este profesor.</p>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Panel de Profesor</h2>
        
        {/* Selector de grupo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar grupo:
          </label>
          <select
            value={selectedGrupo?.idGrupo || ''}
            onChange={(e) => {
              const grupo = grupos.find(g => g.idGrupo === parseInt(e.target.value))
              setSelectedGrupo(grupo)
            }}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {grupos.map(grupo => (
              <option key={grupo.idGrupo} value={grupo.idGrupo}>
                {grupo.nombre} - {grupo.grado}° {grupo.seccion}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {selectedGrupo && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">
              {selectedGrupo.nombre} - {selectedGrupo.grado}° {selectedGrupo.seccion}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><strong>Ciclo Escolar:</strong> {selectedGrupo.cicloEscolar}</div>
              <div><strong>Nivel:</strong> {selectedGrupo.nivel || 'No especificado'}</div>
              <div><strong>Alumnos:</strong> {alumnos.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'grupos', name: 'Mis Grupos' },
              { id: 'alumnos', name: 'Alumnos' },
              { id: 'calificaciones', name: 'Calificaciones' },
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
        {activeTab === 'grupos' && (
          <div>
            <h3 className="text-lg font-bold mb-4">Mis Grupos Asignados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grupos.map(grupo => (
                <div key={grupo.idGrupo} className="border rounded-lg p-4 hover:bg-gray-50">
                  <h4 className="font-medium text-lg mb-2">
                    {grupo.nombre}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Grado:</strong> {grupo.grado}° {grupo.seccion}</div>
                    <div><strong>Ciclo:</strong> {grupo.cicloEscolar}</div>
                    <div><strong>Nivel:</strong> {grupo.nivel || 'No especificado'}</div>
                    <div><strong>Alumnos:</strong> {grupo.totalAlumnos || 'N/A'}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedGrupo(grupo)
                      setActiveTab('alumnos')
                    }}
                    className="mt-3 w-full bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                  >
                    Ver Detalles
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alumnos' && selectedGrupo && (
          <div>
            <h3 className="text-lg font-bold mb-4">Alumnos de {selectedGrupo.nombre}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alumnos.map(alumno => (
                    <tr key={alumno.idAlumno}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {alumno.matricula}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alumno.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alumno.apellido}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alumno.telefono || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alumno.tutor || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {alumnos.length === 0 && (
                <p className="text-center py-4 text-gray-600">No hay alumnos registrados en este grupo</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calificaciones' && selectedGrupo && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Calificaciones de {selectedGrupo.nombre}</h3>
              <button
                onClick={() => setShowCalifModal(true)}
                className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Agregar Calificación
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cal.nombreAlumno} {cal.apellidoAlumno}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cal.materia}</td>
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

        {activeTab === 'avisos' && selectedGrupo && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Avisos para {selectedGrupo.nombre}</h3>
              <button
                onClick={() => setShowAvisoModal(true)}
                className="bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded"
              >
                Crear Aviso
              </button>
            </div>
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
                <p className="text-center py-4 text-gray-600">No hay avisos creados para este grupo</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modales omitidos por brevedad - agregarlos en una implementacion real */}
    </div>
  )
}
