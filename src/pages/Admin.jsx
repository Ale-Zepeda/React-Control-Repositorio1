import { useState, useEffect } from 'react'
import CrudTable from '../components/CrudTable'
import { api } from '../api'
import { useAuth } from '../auth'
import AltaAlumnoForm from '../components/AltaAlumnoForm'
import ProfesorForm from '../components/ProfesorForm'
import AsignarAlumnoDialog from '../components/AsignarAlumnoDialog'
import VerAlumnosTallerDialog from '../components/VerAlumnosTallerDialog'
import MateriasPorGrupo from '../components/MateriasPorGrupo'
import GruposOrganizados from '../components/GruposOrganizados'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('usuarios_profesores');
  const [showAsignarDialog, setShowAsignarDialog] = useState(false);
  const [showVerAlumnosDialog, setShowVerAlumnosDialog] = useState(false);
  const [selectedTaller, setSelectedTaller] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  const [selectedTurno, setSelectedTurno] = useState('Matutino');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const { token } = useAuth()
  const [groupMaterias, setGroupMaterias] = useState([]);
  const [groupMateriasLoading, setGroupMateriasLoading] = useState(false);
  const [groupMateriasError, setGroupMateriasError] = useState(null);

  const tabs = [
    { id: 'usuarios_profesores', name: 'Profesores', endpoint: 'profesores' },
    { id: 'alta_alumno', name: 'Alta Alumno', custom: true },
    { id: 'alumnos', name: 'Alumnos', endpoint: 'alumnos' },
    { id: 'grupos', name: 'Grupos', endpoint: 'grupos' },
    { id: 'materias', name: 'Materias', endpoint: 'materias' },
    { id: 'avisos', name: 'Avisos', endpoint: 'avisos' },
    { id: 'calificaciones', name: 'Calificaciones', endpoint: 'calificaciones' },
    { id: 'talleres', name: 'Talleres', endpoint: 'talleres' }
  ]

  const getTableConfig = (tabId) => {
    switch (tabId) {
      case 'usuarios':
        return {
          columns: [
            { field: 'idUsuario', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'email', header: 'Email' },
{ field: 'rol', header: 'Rol', render: (_val, row) => {
            const v = row?.rol ?? row?.Rol ?? row?.tipo ?? row?.tipoUsuario ?? row?.tipo_usuario;
            const map = {admin:'Administrador', profesor:'Profesor', tutor:'Tutor', alumno:'Alumno'};
            return map[v] || v || '-';
          } }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Contraseña', type: 'password', required: true },
            { 
              name: 'rol', 
              label: 'Rol', 
              type: 'select', 
              required: true,
              options: [
                { value: 'admin', label: 'Administrador' },
                { value: 'profesor', label: 'Profesor' },
                { value: 'tutor', label: 'Tutor' },
                { value: 'alumno', label: 'Alumno' }
              ]
            },
            // Extras opcionales para vinculación alumno<->tutor
            { name: 'tutorNombre', label: 'Tutor (nombre) si el rol es Alumno' },
            { name: 'tutorEmail', label: 'Tutor (email) opcional' },
            { name: 'alumnoId', label: 'Alumno ID si el rol es Tutor' },
            { name: 'alumnoNombre', label: 'Alumno (nombre) para crear si no existe' }
          ],
          idField: 'idUsuario'
        }
      case 'alumnos':
        return {
          columns: [
            { field: 'idAlumnos', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'Ap', header: 'Ap' },
            { field: 'Am', header: 'Am' },
            { field: 'apellido', header: 'Apellido' },
            { field: 'grupo', header: 'Grupo' },
            { field: 'calle', header: 'Calle' },
            { field: 'colonia', header: 'Colonia' },
            { field: 'numero', header: 'Número' },
            { field: 'cp', header: 'CP' },
            { field: 'telefono', header: 'Teléfono' },
            { field: 'email', header: 'Email' }
          ],
          fields: [],
          idField: 'idAlumnos'
        }
      case 'tutores':
        return {
          columns: [
            { field: 'idTutor', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'Ap', header: 'Ap' },
            { field: 'Am', header: 'Am' },
            { field: 'apellido', header: 'Apellido' },
            { field: 'calle', header: 'Calle' },
            { field: 'colonia', header: 'Colonia' },
            { field: 'numero', header: 'Número' },
            { field: 'cp', header: 'CP' },
            { field: 'telefono', header: 'Teléfono' },
            { field: 'email', header: 'Email' }
          ],
          fields: [],
          idField: 'idTutor'
        }
      case 'grupos':
        return {
          columns: [
            { field: 'idGrupo', header: 'ID' },
            { field: 'especialidad', header: '🎓 Especialidad' },
            { field: 'turno', header: '⏰ Turno' },
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
              // Opciones predeterminadas si no hay especialidades en la BD
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
          idField: 'idGrupo'
        }
      case 'materias':
        return {
          columns: [
            { field: 'idMateria', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'semestre', header: 'Semestre' },
            { 
              field: 'periodo', 
              header: 'Periodo',
              render: (val) => val === 1 ? 'Agosto-Enero' : 'Enero-Julio'
            }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { 
              name: 'semestre', 
              label: 'Semestre',
              type: 'select',
              required: true,
              options: [
                { value: 'Primero', label: 'Primero' },
                { value: 'Segundo', label: 'Segundo' },
                { value: 'Tercero', label: 'Tercero' },
                { value: 'Cuarto', label: 'Cuarto' },
                { value: 'Quinto', label: 'Quinto' },
                { value: 'Sexto', label: 'Sexto' }
              ]
            },
            { 
              name: 'periodo',
              label: 'Periodo',
              type: 'select',
              required: true,
              options: [
                { value: 1, label: 'Agosto-Enero' },
                { value: 2, label: 'Enero-Julio' }
              ]
            }
          ],
          idField: 'idMateria'
        }
      case 'avisos':
        return {
          columns: [
            { field: 'idAvisos', header: 'ID' },
            { field: 'mensaje', header: 'Mensaje' },
            { 
              field: 'fecha', 
              header: 'Fecha',
              render: (val) => new Date(val).toLocaleDateString()
            },
            { 
              field: 'hora', 
              header: 'Hora',
              render: (val) => val ? val.substring(0, 5) : ''
            },
            {
              field: 'idGrupo',
              header: 'Grupo',
              render: (val, row) => row.nombreGrupo || 'General'
            },
            {
              field: 'idAlumnos',
              header: 'Dirigido a',
              render: (val, row) => val ? `Alumno: ${row.nombreAlumno}` : (row.idGrupo ? 'Grupo completo' : 'General')
            }
          ],
          fields: [
            { name: 'mensaje', label: 'Mensaje', required: true },
            { 
              name: 'tipoAviso', 
              label: 'Tipo de Aviso',
              type: 'select',
              required: true,
              options: [
                { value: 'general', label: 'General' },
                { value: 'grupo', label: 'Grupo' },
                { value: 'alumno', label: 'Alumno Específico' }
              ],
              defaultValue: 'general'
            },
            {
              name: 'idGrupo',
              label: 'Grupo',
              type: 'select',
              required: ({formData}) => formData?.tipoAviso === 'grupo' || formData?.tipoAviso === 'alumno',
              options: 'grupos',
              optionLabel: row => `${row.especialidad} - ${row.turno} - ${row.semestre}° Semestre`,
              optionValue: 'idGrupo',
              hidden: ({formData}) => formData?.tipoAviso === 'general',
              onChange: (value, form, setFormData) => {
                if (form.tipoAviso === 'alumno') {
                  // Limpiar alumno al cambiar de grupo
                  setFormData({ ...form, idGrupo: value, idAlumnos: null });
                }
              }
            },
            {
              name: 'idAlumnos',
              label: 'Alumno',
              type: 'select',
              required: ({formData}) => formData?.tipoAviso === 'alumno',
              options: ({formData}) => formData?.idGrupo ? `grupos/${formData.idGrupo}/alumnos` : [],
              optionLabel: row => `${row.nombre} ${row.Ap} ${row.Am}`,
              optionValue: 'idAlumno',
              hidden: ({formData}) => formData?.tipoAviso !== 'alumno'
            }
          ],
          idField: 'idAvisos'
        }
      case 'calificaciones':
        return {
          columns: [
            { field: 'idCalificacion', header: 'ID' },
            { field: 'calificacion', header: 'Calificación' },
            { field: 'parcial', header: 'Parcial' },
            { field: 'fecha', header: 'Fecha' }
          ],
          fields: [
            { name: 'calificacion', label: 'Calificación', type: 'number', required: true },
            { 
              name: 'parcial', 
              label: 'Parcial',
              type: 'select',
              required: true,
              options: [
                { value: '1', label: 'Primer Parcial' },
                { value: '2', label: 'Segundo Parcial' },
                { value: '3', label: 'Tercer Parcial' }
              ]
            },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true },
            { name: 'observaciones', label: 'Observaciones' },
            { name: 'idAlumno', label: 'ID Alumno', type: 'number', required: true },
            { name: 'idMateria', label: 'ID Materia', type: 'number', required: true }
          ],
          idField: 'idCalificacion'
        }
      case 'talleres':
        return {
          columns: [
            { field: 'idTalleres', header: 'ID' },
            { field: 'nombreT', header: 'Nombre del Taller' },
            { field: 'profesor', header: 'Profesor' },
            { 
              field: 'actions',
              header: 'Alumnos',
              render: (_, row) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar que se active el doble clic
                    setSelectedTaller(row);
                    setShowVerAlumnosDialog(true);
                  }}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                >
                  Ver Alumnos
                </button>
              )
            }
          ],
          fields: [
            { name: 'nombreT', label: 'Nombre del Taller', required: true },
            { name: 'profesor', label: 'Nombre del Profesor', required: true }
          ],
          idField: 'idTalleres',
          onRowDoubleClick: (row) => {
            setSelectedTaller(row);
            setShowAsignarDialog(true);
          },
          customContent: showAsignarDialog && selectedTaller ? (
            <AsignarAlumnoDialog
              taller={selectedTaller}
              onClose={() => {
                setShowAsignarDialog(false);
                setSelectedTaller(null);
              }}
              onAssign={() => {
                // Recargar los datos de la tabla
                if (typeof onRefresh === 'function') {
                  onRefresh();
                }
              }}
            />
          ) : null,
          rowHint: 'Doble clic para asignar alumno al taller'
        }
      case 'usuarios_profesores':
        return {
          columns: [
            { field: 'idUsuario', header: '🆔 ID' },
            { field: 'nombreCompleto', header: '👨‍🏫 Nombre Completo' },
            { field: 'titulo', header: '🎓 Título/Licenciatura' },
            { field: 'email', header: '📧 Email' },
            { field: 'telefono', header: '📞 Teléfono' },
            { 
              field: 'materias', 
              header: '📚 MATERIAS QUE IMPARTE',
              render: (value) => value || '❌ Sin materias asignadas'
            }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'Ap', label: 'Apellido Paterno', required: true },
            { name: 'Am', label: 'Apellido Materno', required: true },
            { name: 'titulo', label: 'Título/Licenciatura', required: true, placeholder: 'Ej: Licenciatura en Educación' },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Contraseña', type: 'password', required: true },
            { name: 'telefono', label: 'Teléfono', required: true },
            { name: 'calle', label: 'Calle', required: true },
            { name: 'colonia', label: 'Colonia', required: true },
            { name: 'numero', label: 'Número', required: true },
            { name: 'cp', label: 'CP', type: 'number', required: true },
            { 
              name: 'materias', 
              label: 'Materias que imparte', 
              type: 'multi-select',
              apiUrl: '/api/materias',
              optionValue: 'idMateria',
              optionLabel: (item) => `${item.nombre} (${item.semestre}°)`
            }
          ],
          idField: 'idUsuario',
          fixedFields: { idNivel: 2 }
        }
      case 'usuarios_tutores':
        return {
          columns: [
            { field: 'idUsuario', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'email', header: 'Email' },
            { field: 'rol', header: 'Rol', render: () => 'Tutor' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Contraseña', type: 'password', required: true }
          ],
          idField: 'idUsuario',
          fixedFields: { rol: 'tutor' }
        }
      case 'usuarios_alumnos':
        return {
          columns: [
            { field: 'idUsuario', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'email', header: 'Email' },
            { field: 'rol', header: 'Rol', render: () => 'Alumno' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Contraseña', type: 'password', required: true }
          ],
          idField: 'idUsuario',
          fixedFields: { rol: 'alumno' }
        }
      default:
        return { columns: [], fields: [], idField: 'id' }
    }
  }

  const activeTabData = getTableConfig(activeTab)
  const activeTabInfo = tabs.find(tab => tab.id === activeTab)

  // Cargar especialidades disponibles cuando se seleccione la pestaña de alumnos
  useEffect(() => {
    if (activeTab !== 'alumnos') return;
    let mounted = true;
    const loadEspecialidades = async () => {
      try {
        const res = await api('/api/grupos/especialidades', { token });
        if (!mounted) return;
        const especialidadesList = res || [];
        setEspecialidades(especialidadesList);
        // establecer primera especialidad como seleccionada por defecto
        if (especialidadesList.length > 0 && !selectedEspecialidad) {
          setSelectedEspecialidad(especialidadesList[0]);
        }
      } catch (e) {
        console.error('Error cargando especialidades:', e.message || e);
      }
    }
    loadEspecialidades();
    return () => { mounted = false }
  }, [activeTab]);

  // Cargar grupos cuando se seleccione la pestaña de alumnos
  useEffect(() => {
    if (activeTab !== 'alumnos') return;
    let mounted = true;
    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        setGroupsError(null);
        const res = await api('/api/grupos/with-alumnos', { token });
        if (!mounted) return;
        const arr = res || [];
        // normalizar turno a string consistente
        const normalized = arr.map(g => ({ ...g, turno: (g.turno || '').toString() }));
        setGroups(normalized);
        // establecer grupo por defecto para el turno y especialidad seleccionados
        const gruposFiltrados = normalized.filter(g => 
          (g.turno || '').toLowerCase() === (selectedTurno || '').toLowerCase() &&
          (g.especialidad || '').toLowerCase() === (selectedEspecialidad || '').toLowerCase()
        );
        setSelectedGroupId(gruposFiltrados[0]?.idGrupo || null);
      } catch (e) {
        console.error('Error cargando grupos:', e.message || e);
        if (mounted) setGroupsError(e.message || String(e));
      } finally {
        if (mounted) setGroupsLoading(false);
      }
    }
    loadGroups();
    return () => { mounted = false }
  }, [activeTab, selectedTurno, selectedEspecialidad])

  // Cargar materias asignadas al grupo seleccionado
  useEffect(() => {
    if (!selectedGroupId) return;
    let mounted = true;
    (async () => {
      try {
        setGroupMateriasLoading(true);
        setGroupMateriasError(null);
        const res = await api(`/api/materia_profesor/grupo/${selectedGroupId}`, { token });
        if (!mounted) return;
        setGroupMaterias(res || []);
      } catch (e) {
        console.error('Error cargando materias del grupo:', e.message || e);
        if (mounted) setGroupMateriasError(e.message || String(e));
      } finally {
        if (mounted) setGroupMateriasLoading(false);
      }
    })();
    return () => { mounted = false }
  }, [selectedGroupId])

  return (
    <div className="space-y-6">
      <div className="bg-white shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
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

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel Administrativo</h1>
        {activeTab === 'alta_alumno' ? (
          <AltaAlumnoForm />
        ) : activeTab === 'materias' ? (
          <MateriasPorGrupo />
        ) : activeTab === 'grupos' ? (
          <GruposOrganizados />
        ) : activeTab === 'alumnos' ? (
          <div>
            {/* Selector de Turno */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Turno</h3>
              <div className="flex space-x-2">
                {['Matutino', 'Vespertino'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTurno(t);
                      // resetear especialidad al primer grupo disponible del turno
                      const gruposDelTurno = groups.filter(g => (g.turno || '').toLowerCase() === t.toLowerCase());
                      const especialidadesDisponibles = [...new Set(gruposDelTurno.map(g => g.especialidad))];
                      const nuevaEspecialidad = especialidadesDisponibles.includes(selectedEspecialidad) 
                        ? selectedEspecialidad 
                        : especialidadesDisponibles[0] || 'Programación';
                      setSelectedEspecialidad(nuevaEspecialidad);
                      // establecer primer grupo disponible
                      const gruposFiltrados = gruposDelTurno.filter(g => g.especialidad === nuevaEspecialidad);
                      setSelectedGroupId(gruposFiltrados[0]?.idGrupo || null);
                    }}
                    className={`px-4 py-2 rounded ${selectedTurno === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Especialidad */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Especialidad</h3>
              <div className="flex space-x-2 flex-wrap">
                {especialidades.map((esp) => (
                  <button
                    key={esp}
                    onClick={() => {
                      setSelectedEspecialidad(esp);
                      // establecer primer grupo disponible de la especialidad
                      const gruposFiltrados = groups.filter(g => 
                        (g.turno || '').toLowerCase() === (selectedTurno || '').toLowerCase() &&
                        (g.especialidad || '').toLowerCase() === esp.toLowerCase()
                      );
                      setSelectedGroupId(gruposFiltrados[0]?.idGrupo || null);
                    }}
                    className={`px-4 py-2 rounded mb-2 ${selectedEspecialidad === esp ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {esp}
                  </button>
                ))}
                {especialidades.length === 0 && (
                  <div className="text-gray-500">No hay especialidades disponibles</div>
                )}
              </div>
            </div>

            {/* Selector de Grupos */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Grupos</h3>
              {groupsLoading ? (
                <div>Cargando grupos...</div>
              ) : groupsError ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-700">Error cargando grupos: {groupsError}</div>
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        // reintentar carga
                        (async () => {
                          setGroupsLoading(true);
                          setGroupsError(null);
                          try {
                            const res = await api('/api/grupos/with-alumnos', { token });
                            const normalized = (res || []).map(g => ({ ...g, turno: (g.turno || '').toString() }));
                            setGroups(normalized);
                            const gruposFiltrados = normalized.filter(g => 
                              (g.turno || '').toLowerCase() === (selectedTurno || '').toLowerCase() &&
                              (g.especialidad || '').toLowerCase() === (selectedEspecialidad || '').toLowerCase()
                            );
                            setSelectedGroupId(gruposFiltrados[0]?.idGrupo || null);
                          } catch (e) {
                            setGroupsError(e.message || String(e));
                          } finally {
                            setGroupsLoading(false);
                          }
                        })()
                      }}
                      className="mt-2 bg-white border px-3 py-1 rounded shadow-sm"
                    >Reintentar</button>
                  </div>
                </div>
              ) : (
                (() => {
                  const gruposFiltrados = groups.filter(g => 
                    (g.turno || '').toLowerCase() === (selectedTurno || '').toLowerCase() &&
                    (g.especialidad || '').toLowerCase() === (selectedEspecialidad || '').toLowerCase()
                  );
                  
                  // ordenar grupos por semestre (menor a mayor)
                  const gruposOrdenados = gruposFiltrados.sort((a, b) => {
                    const semestreA = parseInt(a.semestre) || 0;
                    const semestreB = parseInt(b.semestre) || 0;
                    return semestreA - semestreB;
                  });
                  
                  if (gruposOrdenados.length === 0) {
                    return <div className="text-gray-600">No hay grupos para la especialidad seleccionada.</div>
                  }
                  return (
                    <nav className="flex space-x-3 overflow-auto">
                      {gruposOrdenados.map(g => (
                        <button
                          key={g.idGrupo}
                          onClick={() => setSelectedGroupId(g.idGrupo)}
                          className={`px-4 py-2 rounded ${selectedGroupId === g.idGrupo ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {`${g.semestre}° Semestre`}
                        </button>
                      ))}
                    </nav>
                  )
                })()
              )}
            </div>

            {/* Lista de Alumnos */}
            <div>
              {selectedGroupId ? (
                (() => {
                  const grupoSeleccionado = groups.find(g => g.idGrupo === selectedGroupId);
                  return (
                    <CrudTable
                      title={`Alumnos - ${grupoSeleccionado?.especialidad} ${grupoSeleccionado?.semestre}° Semestre (${selectedTurno})`}
                      endpoint={`grupos/${selectedGroupId}/alumnos`}
                      columns={[
                        { field: 'idAlumno', header: 'ID' },
                        { field: 'nombre', header: 'Nombre' },
                        { field: 'Ap', header: 'Apellido Paterno' },
                        { field: 'Am', header: 'Apellido Materno' }
                      ]}
                      fields={[]}
                      idField={'idAlumno'}
                      fixedFields={{}}
                      enableActiveToggle={false}
                      showAdd={false}
                    />
                  );
                })()
              ) : (
                <div className="p-4 text-gray-600">Seleccione un turno, especialidad y grupo para ver los alumnos.</div>
              )}
            </div>
          </div>
        ) : (
          <>
            <CrudTable
              title={activeTabInfo?.name || 'Datos'}
              endpoint={activeTabInfo?.endpoint || ''}
              columns={activeTabData.columns}
              fields={activeTabData.fields}
              idField={activeTabData.idField}
              fixedFields={activeTabData.fixedFields || {}}
              enableActiveToggle={true}
              showAdd={activeTab !== 'alumnos'}
              onRowDoubleClick={activeTab === 'talleres' ? (row) => {
                setSelectedTaller(row);
                setShowAsignarDialog(true);
              } : undefined}
              customContent={activeTab === 'talleres' ? (
                <>
                  {showAsignarDialog && selectedTaller && (
                    <AsignarAlumnoDialog
                      taller={selectedTaller}
                      onClose={() => {
                        setShowAsignarDialog(false);
                        setSelectedTaller(null);
                      }}
                      onAssign={() => {
                        // Recargar la tabla después de asignar
                        if (typeof onRefresh === 'function') {
                          onRefresh();
                        }
                      }}
                    />
                  )}
                  {showVerAlumnosDialog && selectedTaller && (
                    <VerAlumnosTallerDialog
                      taller={selectedTaller}
                      onClose={() => {
                        setShowVerAlumnosDialog(false);
                        setSelectedTaller(null);
                      }}
                    />
                  )}
                </>
              ) : null}
              rowHint={activeTab === 'talleres' ? 'Doble clic para asignar alumno al taller' : undefined}
            />
          </>
        )}
      </div>
    </div>
  )
}
