import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AsignacionesForm() {
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    idProfesor: '',
    idMateria: '',
    idGrupo: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profesoresRes, materiasRes, gruposRes, asignacionesRes] = await Promise.all([
          api.get('/usuarios?rol=profesor'),
          api.get('/materias'),
          api.get('/grupos'),
          api.get('/asignaciones')
        ]);

        setProfesores(profesoresRes.data);
        setMaterias(materiasRes.data);
        setGrupos(gruposRes.data);
        setAsignaciones(asignacionesRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/asignaciones', formData);
      // Recargar asignaciones
      const { data } = await api.get('/asignaciones');
      setAsignaciones(data);
      // Limpiar formulario
      setFormData({
        idProfesor: '',
        idMateria: '',
        idGrupo: ''
      });
    } catch (error) {
      console.error('Error creando asignación:', error);
    }
  };

  const handleDelete = async (idProfesor, idMateria, idGrupo) => {
    try {
      await api.delete('/asignaciones', { data: { idProfesor, idMateria, idGrupo } });
      // Recargar asignaciones
      const { data } = await api.get('/asignaciones');
      setAsignaciones(data);
    } catch (error) {
      console.error('Error eliminando asignación:', error);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Nueva Asignación</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Profesor</label>
          <select 
            value={formData.idProfesor}
            onChange={(e) => setFormData(prev => ({ ...prev, idProfesor: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccione un profesor</option>
            {profesores.map(profesor => (
              <option key={profesor.idUsuario} value={profesor.idUsuario}>
                {profesor.nombre} {profesor.Ap} {profesor.Am}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Materia</label>
          <select 
            value={formData.idMateria}
            onChange={(e) => setFormData(prev => ({ ...prev, idMateria: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccione una materia</option>
            {materias.map(materia => (
              <option key={materia.idMateria} value={materia.idMateria}>
                {materia.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Grupo</label>
          <select 
            value={formData.idGrupo}
            onChange={(e) => setFormData(prev => ({ ...prev, idGrupo: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccione un grupo</option>
            {grupos.map(grupo => (
              <option key={grupo.idGrupo} value={grupo.idGrupo}>
                {grupo.grado} - {grupo.turno}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Asignar
        </button>
      </form>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Asignaciones Actuales</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {asignaciones.map((asignacion, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{asignacion.nombreProfesor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asignacion.materia}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asignacion.grupo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(asignacion.idProfesor, asignacion.idMateria, asignacion.idGrupo)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}