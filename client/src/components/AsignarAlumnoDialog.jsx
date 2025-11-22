import { useState } from 'react';
import { api } from '../api';

export default function AsignarAlumnoDialog({ taller, onClose, onAssign }) {
  const [idAlumno, setIdAlumno] = useState('');
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const buscarAlumno = async () => {
    if (!idAlumno) {
      setError('Por favor ingrese un ID de alumno');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const data = await api(`/api/alumnos/${idAlumno}`);
      if (data) {
        console.log('Alumno encontrado:', data);
        setAlumnoInfo(data);
      } else {
        setError('No se encontró el alumno con ese ID');
        setAlumnoInfo(null);
      }
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.message || 'Error al buscar el alumno');
      setAlumnoInfo(null);
    } finally {
      setLoading(false);
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alumnoInfo) return;

    try {
      await api(`/api/talleres/${taller.idTalleres}/alumnos`, {
        method: 'POST',
        body: {
          idAlumnos: parseInt(idAlumno)
        }
      });
      onAssign();
      onClose();
    } catch (error) {
      console.error('Error al asignar:', error);
      setError(error.message || 'Error al asignar el alumno al taller');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Asignar Alumno al Taller: {taller.nombreT}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID del Alumno
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={idAlumno}
                onChange={(e) => setIdAlumno(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el ID del alumno"
              />
              <button
                type="button"
                onClick={buscarAlumno}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                Buscar
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center text-gray-600">
              Buscando alumno...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {alumnoInfo && (
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-medium text-blue-900">Información del Alumno</h3>
              <div className="mt-2 text-sm text-blue-800">
                <p><span className="font-medium">Nombre:</span> {alumnoInfo.nombre} {alumnoInfo.Ap} {alumnoInfo.Am}</p>
                {alumnoInfo.especialidad && (
                  <p><span className="font-medium">Grupo:</span> {alumnoInfo.especialidad} {alumnoInfo.semestre}° {alumnoInfo.turno}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={!alumnoInfo}
            >
              Asignar Alumno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}