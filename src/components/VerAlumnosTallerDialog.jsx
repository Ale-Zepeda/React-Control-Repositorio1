import { useState, useEffect } from 'react';
import { api } from '../api';

export default function VerAlumnosTallerDialog({ taller, onClose }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarAlumnos();
  }, [taller.idTalleres]);

  const cargarAlumnos = async () => {
    try {
      setLoading(true);
      const data = await api(`/api/talleres/${taller.idTalleres}/alumnos`);
      setAlumnos(data);
    } catch (error) {
      setError('Error al cargar los alumnos del taller');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Alumnos en Taller: {taller.nombreT}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Cargando alumnos...</div>
        ) : error ? (
          <div className="text-red-600 p-4 bg-red-50 rounded">{error}</div>
        ) : alumnos.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No hay alumnos asignados a este taller
          </div>
        ) : (
          <div className="divide-y">
            {alumnos.map((alumno) => (
              <div
                key={alumno.idAlumnos}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {alumno.nombre} {alumno.Ap} {alumno.Am}
                  </div>
                  {alumno.especialidad && (
                    <div className="text-sm text-gray-600">
                      {alumno.especialidad} - {alumno.semestre}° {alumno.turno}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}