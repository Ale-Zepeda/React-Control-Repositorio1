import { useState } from 'react'
import CrudTable from '../components/CrudTable'
import AltaAlumnoForm from '../components/AltaAlumnoForm'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('usuarios')

  const tabs = [
    { id: 'usuarios', name: 'Usuarios', endpoint: 'usuarios' },
    { id: 'usuarios_profesores', name: 'Profesores', endpoint: 'usuarios?rol=profesor', fixedFields: { rol: 'profesor' } },
    { id: 'alta_alumno', name: 'Alta Alumno', custom: true },
    { id: 'alumnos', name: 'Alumnos', endpoint: 'alumnos' },
    { id: 'tutores', name: 'Tutores', endpoint: 'tutores' },
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
            { field: 'idAlumno', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'apellido', header: 'Apellido' },
            { field: 'matricula', header: 'Matrícula' },
            { field: 'grupo', header: 'Grupo' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'apellido', label: 'Apellido', required: true },
            { name: 'matricula', label: 'Matrícula', required: true },
            { name: 'fechaNacimiento', label: 'Fecha Nacimiento', type: 'date' },
            { name: 'direccion', label: 'Dirección' },
            { name: 'telefono', label: 'Teléfono' },
            { name: 'idGrupo', label: 'ID Grupo', type: 'number' },
            { name: 'idTutor', label: 'ID Tutor', type: 'number' }
          ],
          idField: 'idAlumno'
        }
      case 'tutores':
        return {
          columns: [
            { field: 'idTutor', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'apellido', header: 'Apellido' },
            { field: 'telefono', header: 'Teléfono' },
            { field: 'email', header: 'Email' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'apellido', label: 'Apellido', required: true },
            { name: 'telefono', label: 'Teléfono', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'direccion', label: 'Dirección' },
            { name: 'ocupacion', label: 'Ocupación' }
          ],
          idField: 'idTutor'
        }
      case 'grupos':
        return {
          columns: [
            { field: 'idGrupo', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'grado', header: 'Grado' },
            { field: 'seccion', header: 'Sección' },
            { field: 'cicloEscolar', header: 'Ciclo' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'grado', label: 'Grado', type: 'number', required: true },
            { name: 'seccion', label: 'Sección', required: true },
            { name: 'cicloEscolar', label: 'Ciclo Escolar', required: true },
            { name: 'idProfesor', label: 'ID Profesor', type: 'number' },
            { name: 'idNivel', label: 'ID Nivel', type: 'number' }
          ],
          idField: 'idGrupo'
        }
      case 'materias':
        return {
          columns: [
            { field: 'idMateria', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'descripcion', header: 'Descripción' },
            { field: 'creditos', header: 'Créditos' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'descripcion', label: 'Descripción' },
            { name: 'creditos', label: 'Créditos', type: 'number' },
            { name: 'idNivel', label: 'ID Nivel', type: 'number' }
          ],
          idField: 'idMateria'
        }
      case 'avisos':
        return {
          columns: [
            { field: 'idAviso', header: 'ID' },
            { field: 'titulo', header: 'Título' },
            { field: 'fecha', header: 'Fecha' },
            { field: 'tipo', header: 'Tipo' }
          ],
          fields: [
            { name: 'titulo', label: 'Título', required: true },
            { name: 'contenido', label: 'Contenido', required: true },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true },
            { 
              name: 'tipo', 
              label: 'Tipo', 
              type: 'select',
              options: [
                { value: 'general', label: 'General' },
                { value: 'grupo', label: 'Grupo' },
                { value: 'urgente', label: 'Urgente' }
              ]
            },
            { name: 'idUsuario', label: 'ID Usuario', type: 'number', required: true }
          ],
          idField: 'idAviso'
        }
      case 'calificaciones':
        return {
          columns: [
            { field: 'idCalificacion', header: 'ID' },
            { field: 'calificacion', header: 'Calificación' },
            { field: 'periodo', header: 'Período' },
            { field: 'fecha', header: 'Fecha' }
          ],
          fields: [
            { name: 'calificacion', label: 'Calificación', type: 'number', required: true },
            { name: 'periodo', label: 'Período', required: true },
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
            { field: 'idTaller', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'descripcion', header: 'Descripción' },
            { field: 'horario', header: 'Horario' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'descripcion', label: 'Descripción', required: true },
            { name: 'horario', label: 'Horario', required: true },
            { name: 'cupoMaximo', label: 'Cupo Máximo', type: 'number' },
            { name: 'idProfesor', label: 'ID Profesor', type: 'number' }
          ],
          idField: 'idTaller'
        }
      case 'usuarios_profesores':
        return {
          columns: [
            { field: 'idUsuario', header: 'ID' },
            { field: 'nombre', header: 'Nombre' },
            { field: 'email', header: 'Email' },
            { field: 'materias', header: 'Materias' }
          ],
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'Ap', label: 'Apellido Paterno' },
            { name: 'Am', label: 'Apellido Materno' },
            { name: 'calle', label: 'Calle' },
            { name: 'colonia', label: 'Colonia' },
            { name: 'numero', label: 'Número' },
            { name: 'cp', label: 'CP', type: 'number' },
            { name: 'telefono', label: 'Teléfono', type: 'number' },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Contraseña', type: 'password', required: true },
            { name: 'materia', label: 'Materia que imparte (coma para varias)' }
          ],
          idField: 'idUsuario',
          fixedFields: { rol: 'profesor' }
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
        ) : (
          <CrudTable
            title={activeTabInfo?.name || 'Datos'}
            endpoint={activeTabInfo?.endpoint || ''}
            columns={activeTabData.columns}
            fields={activeTabData.fields}
            idField={activeTabData.idField}
            fixedFields={activeTabData.fixedFields || {}}
            enableActiveToggle={false}
            showAdd={!(activeTab === 'usuarios' || activeTab === 'tutores')}
          />
        )}
      </div>
    </div>
  )
}
