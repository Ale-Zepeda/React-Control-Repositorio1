import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import CrudTable from '../components/CrudTable'

const GruposOrganizados = () => {
  const { token } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [selectedTurno, setSelectedTurno] = useState('Matutino')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    especialidad: '',
    turno: 'Matutino', 
    semestre: '1'
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  useEffect(() => {
    loadGrupos()
  }, [token])

  // Escuchar cambios desde otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'crudOptionsUpdate') {
        loadGrupos()
      }
    }

    const handleCustomUpdate = () => {
      loadGrupos()
    }

    const handleSuccessMessage = (e) => {
      setSuccessMessage(e.detail.message)
      setTimeout(() => setSuccessMessage(''), 5000)
    }

    const handleErrorMessage = (e) => {
      setErrorMessage(e.detail.message)
      setTimeout(() => setErrorMessage(''), 5000)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('crudOptionsUpdate', handleCustomUpdate)
    window.addEventListener('crudSuccess', handleSuccessMessage)
    window.addEventListener('crudError', handleErrorMessage)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('crudOptionsUpdate', handleCustomUpdate)
      window.removeEventListener('crudSuccess', handleSuccessMessage)
      window.removeEventListener('crudError', handleErrorMessage)
    }
  }, [])

  const loadGrupos = async () => {
    try {
      setLoading(true)
      const result = await api('/api/grupos', { token })
      setGrupos(result)
    } catch (error) {
      console.error('Error cargando grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Combinar formData con fixedFields del turno y especialidad actual
      const dataToSubmit = {
        ...formData,
        turno: formData.turno,
        especialidad: formData.especialidad || Object.keys(gruposOrganizados[selectedTurno] || {})[0] || ''
      }
      
      await api('/api/grupos', {
        method: 'POST',
        body: dataToSubmit,
        token
      })
      
      // Resetear formulario
      setFormData({
        especialidad: '',
        turno: 'Matutino', 
        semestre: '1'
      })
      
      // Cerrar modal y recargar datos
      setShowAddModal(false)
      loadGrupos()
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Grupo agregado exitosamente')
      setTimeout(() => setSuccessMessage(''), 5000)
      
      // Notificar cambios
      localStorage.setItem('crudOptionsUpdate', Date.now().toString())
      window.dispatchEvent(new Event('crudOptionsUpdate'))
    } catch (error) {
      console.error('Error creando grupo:', error)
      setErrorMessage('Error al crear el grupo: ' + error.message)
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  // Organizar grupos por turno y especialidad
  const gruposOrganizados = grupos.reduce((acc, grupo) => {
    const turno = grupo.turno || 'Sin turno'
    if (!acc[turno]) acc[turno] = {}
    
    const especialidad = grupo.especialidad || 'Sin especialidad'
    if (!acc[turno][especialidad]) acc[turno][especialidad] = []
    
    acc[turno][especialidad].push(grupo)
    return acc
  }, {})

  // Ordenar grupos dentro de cada especialidad por semestre
  Object.keys(gruposOrganizados).forEach(turno => {
    Object.keys(gruposOrganizados[turno]).forEach(especialidad => {
      gruposOrganizados[turno][especialidad].sort((a, b) => {
        const semestreA = parseInt(a.semestre) || 0
        const semestreB = parseInt(b.semestre) || 0
        return semestreA - semestreB
      })
    })
  })

  const turnos = ['Matutino', 'Vespertino', 'Sin turno'].filter(turno => gruposOrganizados[turno])

  // Obtener especialidades existentes para el combo
  const especialidadesExistentes = [...new Set(grupos.map(grupo => grupo.especialidad || ''))]
    .filter(esp => esp.trim() !== '')
    .sort()

  const getGruposConfig = (turno, especialidad) => ({
    columns: [
      { field: 'idGrupo', header: 'ID' },
      { field: 'especialidad', header: '🎓 Especialidad' },
      { 
        field: 'semestre', 
        header: '📚 Semestre',
        render: (value) => `${value}°`
      },
      { 
        field: 'totalAlumnos', 
        header: '👥 Total Alumnos',
        render: (value) => {
          const num = parseInt(value) || 0;
          return num === 0 ? '➖ Sin alumnos' : `${num} alumno${num !== 1 ? 's' : ''}`;
        }
      }
    ],
    fields: [
      { 
        name: 'especialidad', 
        label: 'Especialidad',
        type: 'select-or-text',
        required: true,
        apiUrl: '/api/grupos/especialidades',
        allowCustom: true,
        customPlaceholder: 'Escriba la nueva especialidad...',
        defaultOptions: [
          'Informática',
          'Programación', 
          'Electrónica',
          'Mecatrónica',
          'Diseño Gráfico',
          'Administración',
          'Contabilidad'
        ]
      },
      {
        name: 'turno',
        label: 'Turno',
        type: 'select',
        required: true,
        defaultValue: turno === 'Sin turno' ? 'Matutino' : turno,
        options: [
          { value: 'Matutino', label: 'Matutino' },
          { value: 'Vespertino', label: 'Vespertino' }
        ]
      },
      {
        name: 'semestre',
        label: 'Semestre',
        type: 'select',
        required: true,
        options: [
          { value: '1', label: '1° Semestre' },
          { value: '2', label: '2° Semestre' },
          { value: '3', label: '3° Semestre' },
          { value: '4', label: '4° Semestre' },
          { value: '5', label: '5° Semestre' },
          { value: '6', label: '6° Semestre' }
        ]
      }
    ],
    idField: 'idGrupo',
    // Pre-llenar campos según la sección actual
    fixedFields: {
      turno: turno === 'Sin turno' ? 'Matutino' : turno,
      especialidad: especialidad
    }
  })

  if (loading) {
    return <div className="flex justify-center p-4">Cargando grupos...</div>
  }

  if (grupos.length === 0) {
    return (
      <div className="text-center p-8 bg-white shadow rounded-lg">
        <div className="text-6xl mb-4">🎓</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay grupos disponibles
        </h3>
        <p className="text-gray-500 mb-4">
          Crea tu primer grupo para empezar a organizar estudiantes.
        </p>
        <div className="text-sm text-gray-400">
          💡 Tip: Los grupos se organizarán automáticamente por turno y especialidad
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensajes de éxito y error */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-500">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500">✗</span>
            </div>
            <div className="ml-3">
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Turnos */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            🎓 Gestión de Grupos por Turno
          </h3>
          <button
            onClick={() => {
              // Pre-llenar el formulario con el turno seleccionado
              setFormData({
                especialidad: '',
                turno: selectedTurno === 'Sin turno' ? 'Matutino' : selectedTurno,
                semestre: '1'
              })
              setShowAddModal(true)
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            ➕ Agregar Nuevo Grupo
          </button>
        </div>
        
        <div className="flex space-x-2 mb-4">
          {turnos.map(turno => (
            <button
              key={turno}
              onClick={() => setSelectedTurno(turno)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTurno === turno
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              {turno === 'Matutino' ? '🌅' : turno === 'Vespertino' ? '🌇' : '⏰'} {turno}
            </button>
          ))}
        </div>
      </div>

      {/* Grupos del Turno Seleccionado */}
      {selectedTurno && gruposOrganizados[selectedTurno] && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              {selectedTurno === 'Matutino' ? '🌅' : selectedTurno === 'Vespertino' ? '🌇' : '⏰'} 
              Grupos del Turno {selectedTurno}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Grupos organizados por especialidad y semestre
            </p>
          </div>
          
          <div className="p-4 space-y-6">
            {Object.entries(gruposOrganizados[selectedTurno]).map(([especialidad, gruposEspecialidad]) => (
              <div key={especialidad} className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h5 className="font-medium text-gray-800">
                    📚 {especialidad}
                  </h5>
                  <p className="text-sm text-gray-500">
                    {gruposEspecialidad.length} grupo{gruposEspecialidad.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="p-4">
                  <CrudTable
                    endpoint={`grupos?turno=${encodeURIComponent(selectedTurno)}&especialidad=${encodeURIComponent(especialidad)}`}
                    {...getGruposConfig()}
                    showAdd={false}
                    key={`grupos-${selectedTurno}-${especialidad}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para Agregar Grupo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ➕ Agregar Nuevo Grupo
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {getGruposConfig().fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.name === 'especialidad' ? (
                    <div className="relative">
                      <input
                        type="text"
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        required={field.required}
                        list="especialidades-existentes"
                        placeholder="Selecciona una especialidad existente o escribe una nueva..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <datalist id="especialidades-existentes">
                        {especialidadesExistentes.map(esp => (
                          <option key={esp} value={esp} />
                        ))}
                      </datalist>
                      {especialidadesExistentes.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          Especialidades existentes: {especialidadesExistentes.join(', ')}
                        </div>
                      )}
                    </div>
                  ) : field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {field.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Agregar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GruposOrganizados