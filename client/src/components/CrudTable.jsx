import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'

export default function CrudTable({ 
  title, 
  endpoint, 
  columns, 
  fields,
  idField = 'id',
  fixedFields = {},
  enableActiveToggle = false,
  showAdd = true
}) {
  const { token } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadData()
  }, [endpoint, token])

  const resource = endpoint.split('?')[0]

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await api(`/api/${endpoint}`, { token })
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        // Actualizar
        await api(`/api/${resource}/${editingItem[idField]}`, {
          method: 'PUT',
          body: { ...formData, ...fixedFields },
          token
        })
      } else {
        // Crear
        await api(`/api/${resource}`, {
          method: 'POST',
          body: { ...formData, ...fixedFields },
          token
        })
      }
      closeModal()
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (item) => {
    if (window.confirm(`¿Eliminar ${item[columns[0]?.field] || 'este registro'}?`)) {
      try {
        await api(`/api/${resource}/${item[idField]}`, {
          method: 'DELETE',
          token
        })
        loadData()
      } catch (e) {
        setError(e.message)
      }
    }
  }

  const handleToggleActive = async (item) => {
    try {
      await api(`/api/${resource}/${item[idField]}/activo`, {
        method: 'PUT',
        body: { activo: item.activo ? 0 : 1 },
        token
      })
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const openModal = (item = null) => {
    setEditingItem(item)
    setFormData(item || {})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({})
  }

  if (loading) return <div className="flex justify-center p-4">Cargando...</div>

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {showAdd && (
            <button
              onClick={() => openModal()}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Agregar
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col.field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={item[idField] || index}>
                  {columns.map((col) => (
                    <td key={col.field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {col.field === 'activo' && enableActiveToggle ? (
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`${item.activo ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'} border px-3 py-1 rounded`}
                          title={item.activo ? 'Activo (click para desactivar)' : 'Inactivo (click para activar)'}
                        >
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      ) : (
                        col.render ? col.render(item[col.field], item) : item[col.field]
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
<div className="relative top-20 mx-auto p-6 border w-[720px] max-w-full shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Editar' : 'Agregar'} {title}
              </h3>
<form onSubmit={handleSubmit}>
                {resource === 'usuarios' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                    <select
                      value={formData.rol || fixedFields.rol || ''}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {(fields.find(f => f.name === 'rol')?.options || []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.filter(f => f.name !== 'rol').map((field) => (
                  <div key={field.name} className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={field.required}
                      >
                        <option value="">Seleccionar...</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                </div>

                {resource === 'usuarios' && (formData.rol || fixedFields.rol) === 'alumno' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <div className="font-medium text-blue-800 mb-2">Vincular Tutor</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="w-full px-3 py-2 border rounded" placeholder="Tutor (nombre)" value={formData.tutorNombre || ''} onChange={e=>setFormData({...formData, tutorNombre:e.target.value})} />
                      <input className="w-full px-3 py-2 border rounded" placeholder="Tutor (email)" value={formData.tutorEmail || ''} onChange={e=>setFormData({...formData, tutorEmail:e.target.value})} />
                    </div>
                  </div>
                )}
                {resource === 'usuarios' && (formData.rol || fixedFields.rol) === 'tutor' && (
                  <div className="mt-4 p-3 bg-green-50 rounded">
                    <div className="font-medium text-green-800 mb-2">Vincular Alumno</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="w-full px-3 py-2 border rounded" placeholder="Alumno ID (opcional)" value={formData.alumnoId || ''} onChange={e=>setFormData({...formData, alumnoId:e.target.value})} />
                      <input className="w-full px-3 py-2 border rounded" placeholder="Alumno (nombre) si no existe" value={formData.alumnoNombre || ''} onChange={e=>setFormData({...formData, alumnoNombre:e.target.value})} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}