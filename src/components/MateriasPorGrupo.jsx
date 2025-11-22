import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import CrudTable from '../components/CrudTable'

const MateriasPorGrupo = () => {
  const { token } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [selectedGrupo, setSelectedGrupo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrupos()
  }, [token])

  // Escuchar cambios en grupos desde otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'crudOptionsUpdate') {
        loadGrupos()
      }
    }

    const handleCustomUpdate = () => {
      loadGrupos()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('crudOptionsUpdate', handleCustomUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('crudOptionsUpdate', handleCustomUpdate)
    }
  }, [])

  const loadGrupos = async () => {
    try {
      setLoading(true)
      const result = await api('/api/grupos', { token })
      setGrupos(result)
      
      // Seleccionar el primer grupo por defecto si no hay uno seleccionado
      if (result.length > 0 && !selectedGrupo) {
        setSelectedGrupo(result[0])
      }
    } catch (error) {
      console.error('Error cargando grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Convertir número de semestre a texto
  const convertirSemestreATexto = (numeroSemestre) => {
    const conversiones = {
      '1': 'Primero',
      '2': 'Segundo', 
      '3': 'Tercero',
      '4': 'Cuarto',
      '5': 'Quinto',
      '6': 'Sexto'
    }
    return conversiones[numeroSemestre.toString()] || numeroSemestre
  }

  const getMateriasConfig = (grupo) => ({
    columns: [
      { field: 'idMateria', header: 'ID' },
      { field: 'nombre', header: '📚 Nombre de la Materia' },
      { 
        field: 'semestre', 
        header: 'Semestre',
        render: (value) => `${value}°`
      },
      { 
        field: 'periodo', 
        header: 'Periodo',
        render: (val) => val === 1 ? 'Agosto-Enero' : 'Enero-Julio'
      }
    ],
    fields: [
      { 
        name: 'nombre', 
        label: 'Nombre de la Materia', 
        required: true,
        placeholder: 'Ej: Matemáticas, Física, Historia...'
      }
    ],
    idField: 'idMateria',
    // Auto-completar semestre y periodo basado en el grupo
    fixedFields: { 
      semestre: convertirSemestreATexto(grupo.semestre),
      periodo: 1 // Por defecto Agosto-Enero, se puede cambiar después si es necesario
    }
  })

  if (loading) {
    return <div className="flex justify-center p-4">Cargando grupos...</div>
  }

  if (grupos.length === 0) {
    return (
      <div className="text-center p-8 bg-white shadow rounded-lg">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay grupos disponibles
        </h3>
        <p className="text-gray-500 mb-4">
          Primero debes crear grupos en la pestaña de "Grupos" para poder agregar materias.
        </p>
        <div className="text-sm text-gray-400">
          💡 Tip: Ve a Grupos → Agregar nuevo grupo → Luego regresa aquí para agregar materias
        </div>
      </div>
    )
  }

  // Organizar grupos por turno y ordenar por semestre
  const gruposOrganizados = grupos.reduce((acc, grupo) => {
    const turno = grupo.turno || 'Sin turno'
    if (!acc[turno]) acc[turno] = []
    acc[turno].push(grupo)
    return acc
  }, {})

  // Ordenar cada turno por semestre (menor a mayor)
  Object.keys(gruposOrganizados).forEach(turno => {
    gruposOrganizados[turno].sort((a, b) => {
      const semestreA = parseInt(a.semestre) || 0
      const semestreB = parseInt(b.semestre) || 0
      return semestreA - semestreB
    })
  })

  const turnos = ['Matutino', 'Vespertino', 'Sin turno'].filter(turno => gruposOrganizados[turno])

  return (
    <div className="space-y-6">
      {/* Selector de Grupos Organizado */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📚 Materias por Grupo
        </h3>
        
        {turnos.map(turno => (
          <div key={turno} className="mb-6 last:mb-0">
            <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
              {turno === 'Matutino' ? '🌅' : turno === 'Vespertino' ? '🌇' : '⏰'} {turno}
            </h4>
            <div className="flex flex-wrap gap-2 ml-4">
              {gruposOrganizados[turno].map((grupo) => (
                <button
                  key={grupo.idGrupo}
                  onClick={() => setSelectedGrupo(grupo)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGrupo?.idGrupo === grupo.idGrupo
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">
                      {grupo.especialidad}
                    </div>
                    <div className="text-xs opacity-75">
                      {grupo.semestre}° Semestre
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Materias del Grupo Seleccionado */}
      {selectedGrupo && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              📚 Materias de: {selectedGrupo.especialidad} {selectedGrupo.semestre}° Semestre
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {selectedGrupo.turno}
              </span>
            </h4>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                Las materias se agregarán automáticamente al {selectedGrupo.semestre}° semestre. Solo ingresa el nombre.
              </p>
              <div className="text-xs text-gray-400">
                Filtro: semestre = "{convertirSemestreATexto(selectedGrupo.semestre)}"
              </div>
            </div>
          </div>
          <div className="p-4">
            <CrudTable
              endpoint={`materias?semestre=${convertirSemestreATexto(selectedGrupo.semestre)}`}
              {...getMateriasConfig(selectedGrupo)}
              key={`materias-${selectedGrupo.idGrupo}-${selectedGrupo.semestre}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MateriasPorGrupo