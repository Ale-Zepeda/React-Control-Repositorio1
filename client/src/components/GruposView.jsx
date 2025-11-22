import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

export default function GruposView() {
  const { token } = useAuth();
  const [gruposData, setGruposData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState(null);
  const [selectedSemestre, setSelectedSemestre] = useState(null);
  const [selectedTurno, setSelectedTurno] = useState(null);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
      const data = await api('/api/grupos', { token });
      setGruposData(data);
      // Seleccionar la primera especialidad por defecto
      if (data && Object.keys(data).length > 0) {
        setSelectedEspecialidad(Object.keys(data)[0]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando grupos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!gruposData || Object.keys(gruposData).length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Grupos</h2>
        <p className="text-gray-600">No hay grupos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Grupos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel de Especialidades */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Especialidades</h3>
            <div className="space-y-2">
              {Object.keys(gruposData).map((especialidad) => (
                <button
                  key={especialidad}
                  onClick={() => {
                    setSelectedEspecialidad(especialidad);
                    setSelectedSemestre(null);
                    setSelectedTurno(null);
                  }}
                  className={`w-full text-left px-4 py-2 rounded ${
                    selectedEspecialidad === especialidad
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {especialidad}
                </button>
              ))}
            </div>
          </div>

          {/* Panel de Semestres */}
          {selectedEspecialidad && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Semestres</h3>
              <div className="space-y-2">
                {Object.values(gruposData[selectedEspecialidad].semestres).map((semestre) => (
                  <button
                    key={semestre.nombre}
                    onClick={() => {
                      setSelectedSemestre(semestre);
                      setSelectedTurno(null);
                    }}
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedSemestre?.nombre === semestre.nombre
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {semestre.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Panel de Turnos */}
          {selectedSemestre && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Turnos y Grupos</h3>
              <div className="space-y-4">
                {Object.entries(selectedSemestre.turnos).map(([turno, grupos]) => (
                  <div key={turno} className="border-b last:border-b-0 pb-4">
                    <h4 className="font-medium mb-2">{turno}</h4>
                    <div className="space-y-2">
                      {grupos.map((grupo) => (
                        <button
                          key={grupo.idGrupo}
                          onClick={() => setSelectedTurno({ turno, grupo })}
                          className={`w-full text-left px-4 py-2 rounded ${
                            selectedTurno?.grupo?.idGrupo === grupo.idGrupo
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          Grupo {grupo.idGrupo}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detalles del Grupo Seleccionado */}
        {selectedTurno && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Detalles del Grupo</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Especialidad</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedEspecialidad}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Semestre</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedSemestre.nombre}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Turno</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedTurno.turno}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">ID del Grupo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedTurno.grupo.idGrupo}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Ejemplo de la estructura de datos esperada del backend:
/*
{
  "Mecatrónica": {
    "nombre": "Mecatrónica",
    "semestres": {
      "1": {
        "nombre": "Primer Semestre",
        "turnos": {
          "Matutino": [
            { "idGrupo": 1, "totalAlumnos": 30 },
            { "idGrupo": 2, "totalAlumnos": 25 }
          ],
          "Vespertino": [
            { "idGrupo": 3, "totalAlumnos": 28 }
          ]
        }
      },
      // ... más semestres
    }
  },
  // ... más especialidades
}
*/