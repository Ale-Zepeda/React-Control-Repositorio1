import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'

export default function AgregarAlumno() {
  const { token } = useAuth()
  const [tutores, setTutores] = useState([])
  const [grupos, setGrupos] = useState([])
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    calle: '',
    colonia: '',
    numero: '',
    cp: '',
    telefono: '',
    email: '',
    idNivel: '1', // Default a primaria
    idGrupo: '',
    idTutor: ''
  })

  useEffect(() => {
    cargarTutores()
    cargarGrupos()
  }, [token])

  const cargarTutores = async () => {
    try {
      const data = await api('/api/tutores', { token })
      setTutores(data)
    } catch (error) {
      console.error('Error cargando tutores:', error)
      setMensaje({ tipo: 'error', texto: 'Error cargando tutores' })
    }
  }

  const cargarGrupos = async () => {
    try {
      const data = await api('/api/grupos', { token })
      setGrupos(data)
    } catch (error) {
      console.error('Error cargando grupos:', error)
      setMensaje({ tipo: 'error', texto: 'Error cargando grupos' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje({ tipo: '', texto: '' })

    try {
      await api('/api/alumnos/crear-con-tutor', {
        method: 'POST',
        body: formData,
        token
      })

      setMensaje({
        tipo: 'exito',
        texto: 'Alumno creado y asignado exitosamente'
      })

      // Limpiar el formulario
      setFormData({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        calle: '',
        colonia: '',
        numero: '',
        cp: '',
        telefono: '',
        email: '',
        idNivel: '1',
        idGrupo: '',
        idTutor: ''
      })

    } catch (error) {
      console.error('Error creando alumno:', error)
      setMensaje({
        tipo: 'error',
        texto: error.message || 'Error creando alumno'
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Agregar Nuevo Alumno</h2>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg ${
          mensaje.tipo === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Personal</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido Paterno</label>
              <input
                type="text"
                name="apellidoPaterno"
                value={formData.apellidoPaterno}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido Materno</label>
              <input
                type="text"
                name="apellidoMaterno"
                value={formData.apellidoMaterno}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Dirección y asignaciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dirección y Asignaciones</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Calle</label>
              <input
                type="text"
                name="calle"
                value={formData.calle}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Colonia</label>
              <input
                type="text"
                name="colonia"
                value={formData.colonia}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">CP</label>
                <input
                  type="text"
                  name="cp"
                  value={formData.cp}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nivel</label>
              <select
                name="idNivel"
                value={formData.idNivel}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="1">Primaria</option>
                <option value="2">Secundaria</option>
                <option value="3">Preparatoria</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grupo</label>
              <select
                name="idGrupo"
                value={formData.idGrupo}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecciona un grupo</option>
                {grupos.map(grupo => (
                  <option key={grupo.idGrupo} value={grupo.idGrupo}>
                    {grupo.grado} - {grupo.turno}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tutor</label>
              <select
                name="idTutor"
                value={formData.idTutor}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecciona un tutor</option>
                {tutores.map(tutor => (
                  <option key={tutor.idUsuario} value={tutor.idUsuario}>
                    {tutor.nombre} {tutor.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setFormData({
              nombre: '',
              apellidoPaterno: '',
              apellidoMaterno: '',
              calle: '',
              colonia: '',
              numero: '',
              cp: '',
              telefono: '',
              email: '',
              idNivel: '1',
              idGrupo: '',
              idTutor: ''
            })}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Agregar Alumno
          </button>
        </div>
      </form>
    </div>
  )
}