import { useState, useEffect } from 'react';
import { api } from '../api';
import CrudTable from './CrudTable';

export default function ProfesorForm() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const data = await api('/api/materias');
        setMaterias(data.map(m => ({
          value: m.idMateria,
          label: m.nombre
        })));
      } catch (error) {
        console.error('Error cargando materias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterias();
  }, []);

  if (loading) return <div className="flex justify-center p-4">Cargando...</div>;

    const tableConfig = {
    title: 'Gestión de Profesores',
    endpoint: 'profesores',
    columns: [
      { field: 'id', header: 'ID' },
      { 
        field: 'nombreCompleto', 
        header: 'Nombre Completo'
      },
      { field: 'email', header: 'Email' },
      { field: 'telefono', header: 'Teléfono' }
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'Ap', label: 'Apellido Paterno', required: true },
      { name: 'Am', label: 'Apellido Materno', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { 
        name: 'password', 
        label: 'Contraseña', 
        type: 'password', 
        required: ({isNew}) => isNew, // solo requerida al crear
        hidden: ({isNew}) => !isNew // oculta al editar
      },
      { name: 'telefono', label: 'Teléfono', required: true },
      { name: 'calle', label: 'Calle', required: true },
      { name: 'colonia', label: 'Colonia', required: true },
      { name: 'numero', label: 'Número', required: true },
      { name: 'cp', label: 'Código Postal', type: 'number', required: true },
      { 
        name: 'materiasAsignadas',
        label: 'Materias',
        type: 'select',
        multiple: true,
        options: materias
      }
    ],
    idField: 'idProfesor'
  };

  return (
    <div className="space-y-6">
      <CrudTable
        {...tableConfig}
        enableActiveToggle={false}
        showAdd={true}
      />
    </div>
  );
}