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
  showAdd = true,
  onRowDoubleClick,
  customContent,
  rowHint,
  customFilter
}) {
  const { token } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [fieldOptions, setFieldOptions] = useState({})
  const [optionsVersion, setOptionsVersion] = useState(0)

  useEffect(() => {
    loadData()
  }, [endpoint, token])

  // Escuchar cambios en opciones desde otras pestañas/componentes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'crudOptionsUpdate') {
        // Recargar opciones cuando otro componente las actualice
        setOptionsVersion(prev => prev + 1)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // También escuchar el evento customizado para la misma pestaña
    const handleCustomUpdate = () => {
      setOptionsVersion(prev => prev + 1)
    }
    
    window.addEventListener('crudOptionsUpdate', handleCustomUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('crudOptionsUpdate', handleCustomUpdate)
    }
  }, [])

  // Función para cargar opciones dinámicas
  const loadFieldOptions = async () => {
    for (const field of fields) {
      if (field.type === 'select' || field.type === 'select-or-text' || field.type === 'multi-select') {
        // Usar apiUrl si está definido, sino usar options
        const apiEndpoint = field.apiUrl || field.options;
        
        if (typeof apiEndpoint === 'string') {
          try {
            const result = await api(apiEndpoint, { token });
            setFieldOptions(prev => ({
              ...prev,
              [field.name]: result
            }));
          } catch (e) {
            console.error(`Error loading options for ${field.name}:`, e);
          }
        } else if (typeof field.options === 'function') {
          const result = field.options({formData});
          if (typeof result === 'string') {
            try {
              const apiResult = await api(`/api/${result}`, { token });
              setFieldOptions(prev => ({
                ...prev,
                [field.name]: apiResult
              }));
            } catch (e) {
              console.error(`Error loading options for ${field.name}:`, e);
            }
          }
        }
      }
    }
  };

  // Cargar opciones dinámicas para los campos select, select-or-text y multi-select
  useEffect(() => {
    if (fields.length > 0 && token) {
      loadFieldOptions();
    }
  }, [fields, token, formData, optionsVersion])

  const resource = endpoint.split('?')[0]

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await api(`/api/${endpoint}`, { token })
      
      // Debug temporal para profesores
      if (endpoint === 'profesores' && result.length > 0) {
        console.log('🎯 FRONTEND - Primer profesor recibido:', result[0]);
        console.log('🎯 FRONTEND - Campos disponibles:', Object.keys(result[0]));
      }
      
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
      // Procesar campos select-or-text
      const processedData = { ...formData };
      fields.forEach(field => {
        if (field.type === 'select-or-text' && formData[field.name] === 'otra') {
          // Si seleccionó "otra", usar el valor del campo personalizado
          processedData[field.name] = formData[`${field.name}_custom`] || '';
          // Eliminar el campo auxiliar
          delete processedData[`${field.name}_custom`];
        }
      });

      if (editingItem) {
        // Actualizar
        await api(`/api/${resource}/${editingItem[idField]}`, {
          method: 'PUT',
          body: { ...processedData, ...fixedFields },
          token
        })
      } else {
        // Crear
        await api(`/api/${resource}`, {
          method: 'POST',
          body: { ...processedData, ...fixedFields },
          token
        })
      }
      closeModal()
      loadData()
      
      // Limpiar mensajes después de éxito
      setError(null)
      setSuccessMessage(null)
      
      // Notificar a otros componentes que las opciones pueden haber cambiado
      localStorage.setItem('crudOptionsUpdate', Date.now().toString())
      window.dispatchEvent(new Event('crudOptionsUpdate'))
      
      // Recargar opciones localmente también
      setOptionsVersion(prev => prev + 1)
    } catch (e) {
      setError(e.message)
      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDelete = async (item) => {
    if (window.confirm(`¿Eliminar ${item[columns[0]?.field] || 'este registro'}?`)) {
      try {
        const response = await api(`/api/${resource}/${item[idField]}`, {
          method: 'DELETE',
          token
        })
        
        // Mostrar mensaje de éxito si el servidor lo proporciona
        if (response && response.message) {
          setSuccessMessage(response.message)
          // Emitir evento global para que otros componentes muestren el mensaje
          window.dispatchEvent(new CustomEvent('crudSuccess', { detail: { message: response.message } }))
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => setSuccessMessage(null), 5000)
        }
        
        loadData()
        
        // Notificar a otros componentes que las opciones pueden haber cambiado
        localStorage.setItem('crudOptionsUpdate', Date.now().toString())
        window.dispatchEvent(new Event('crudOptionsUpdate'))
        
        // Recargar opciones localmente también
        setOptionsVersion(prev => prev + 1)
      } catch (e) {
        setError(e.message)
        // Limpiar mensaje de error después de 5 segundos
        setTimeout(() => setError(null), 5000)
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
    // Limpiar mensajes al abrir modal
    setError(null)
    setSuccessMessage(null)
    
    setEditingItem(item)
    // Initialize with default values for new items
    let initialData = item || {
      ...fields.reduce((acc, field) => {
        if (field.defaultValue !== undefined) {
          acc[field.name] = field.defaultValue;
        }
        return acc;
      }, {}),
      ...fixedFields
    };

    // Procesar materiasIds para campos multi-select
    if (item && item.materiasIds) {
      initialData = {...initialData};
      // Convertir string "1,2,3" a array [1,2,3]
      initialData.materias = item.materiasIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    setFormData(initialData)
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

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            ✅ {successMessage}
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
              {rowHint && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-2 text-sm text-gray-500 italic bg-gray-50">
                    {rowHint}
                  </td>
                </tr>
              )}
              {(customFilter ? data.filter(customFilter) : data).map((item, index) => (
                <tr 
                  key={`${item[idField]}-${index}`}
                  onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(item)}
                  className={onRowDoubleClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  {columns.map((col) => (
                    <td key={`${item[idField]}-${col.field}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {col.field === 'activo' && enableActiveToggle ? (
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`${item.activo ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'} border px-3 py-1 rounded`}
                          title={item.activo ? 'Activo (click para desactivar)' : 'Inactivo (click para activar)'}
                        >
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      ) : col.field === 'idUsuario' ? (
                        // Forzar mostrar ID para debugging
                        <strong style={{color: 'blue'}}>{item[col.field] || 'SIN_ID'}</strong>
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

      {customContent}

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
                      <option key="default" value="">Seleccionar...</option>
                      {(fields.find(f => f.name === 'rol')?.options || []).map((option) => (
                        <option key={`rol-${option.value}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.filter(f => {
                  // Si el campo tiene una función hidden, la evaluamos
                  if (typeof f.hidden === 'function') {
                    return !f.hidden({ formData, isNew: !editingItem });
                  }
                  // Si no tiene hidden, lo mostramos
                  return f.name !== 'rol';
                }).map((field) => (
                  <div key={field.name} className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    {field.type === 'select-or-text' ? (
                      <div className="space-y-2">
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setFormData({...formData, [field.name]: newValue});
                            if (field.onChange) {
                              field.onChange(newValue, formData, setFormData);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={typeof field.required === 'function' ? field.required({formData}) : field.required}
                        >
                          <option value="">Seleccionar...</option>
                          {(() => {
                            // Si tenemos opciones cargadas desde la API
                            if (fieldOptions[field.name]) {
                              return [
                                ...fieldOptions[field.name].map(especialidad => (
                                  <option key={`${field.name}-${especialidad}`} value={especialidad}>
                                    {especialidad}
                                  </option>
                                )),
                                <option key={`${field.name}-otra`} value="otra">Otra (escribir)</option>
                              ];
                            }
                            // Si son opciones estáticas
                            else if (Array.isArray(field.options)) {
                              return field.options.map(option => (
                                <option key={`${field.name}-${option.value}`} value={option.value}>
                                  {option.label}
                                </option>
                              ));
                            }
                            // Si hay opciones predeterminadas
                            else if (Array.isArray(field.defaultOptions)) {
                              return [
                                ...field.defaultOptions.map(opcion => (
                                  <option key={`${field.name}-${opcion}`} value={opcion}>
                                    {opcion}
                                  </option>
                                )),
                                <option key={`${field.name}-otra`} value="otra">Otra (escribir)</option>
                              ];
                            }
                            return [<option key={`${field.name}-otra`} value="otra">Escribir especialidad</option>];
                          })()}
                        </select>
                        {formData[field.name] === 'otra' && (
                          <input
                            type="text"
                            value={formData[`${field.name}_custom`] || ''}
                            onChange={(e) => setFormData({...formData, [`${field.name}_custom`]: e.target.value})}
                            placeholder={field.customPlaceholder || 'Escriba el valor personalizado...'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        )}
                      </div>
                    ) : field.type === 'multi-select' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                          {(() => {
                            if (fieldOptions[field.name]) {
                              return fieldOptions[field.name].map(item => {
                                const value = item[field.optionValue];
                                const isSelected = Array.isArray(formData[field.name]) 
                                  ? formData[field.name].includes(value)
                                  : false;
                                
                                return (
                                  <label key={`${field.name}-${value}`} className="flex items-center space-x-2 mb-1">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const currentValues = Array.isArray(formData[field.name]) 
                                          ? [...formData[field.name]] 
                                          : [];
                                        
                                        if (e.target.checked) {
                                          if (!currentValues.includes(value)) {
                                            currentValues.push(value);
                                          }
                                        } else {
                                          const index = currentValues.indexOf(value);
                                          if (index > -1) {
                                            currentValues.splice(index, 1);
                                          }
                                        }
                                        
                                        setFormData({...formData, [field.name]: currentValues});
                                      }}
                                      className="rounded"
                                    />
                                    <span className="text-sm">
                                      {field.optionLabel ? field.optionLabel(item) : value}
                                    </span>
                                  </label>
                                );
                              });
                            }
                            return <p className="text-gray-500">Cargando opciones...</p>;
                          })()}
                        </div>
                      </div>
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormData({...formData, [field.name]: newValue});
                          if (field.onChange) {
                            field.onChange(newValue, formData, setFormData);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={typeof field.required === 'function' ? field.required({formData}) : field.required}
                      >
                        <option key="default" value="">Seleccionar...</option>
                        {(() => {
                          // Si tenemos opciones cargadas desde la API
                          if (fieldOptions[field.name]) {
                            return fieldOptions[field.name].map(item => {
                              const value = item[field.optionValue];
                              if (value === undefined || value === null) return null;
                              return (
                                <option key={`${field.name}-${value}`} value={value}>
                                  {field.optionLabel ? field.optionLabel(item) : value}
                                </option>
                              );
                            }).filter(Boolean);
                          }
                          // Si son opciones estáticas
                          else if (Array.isArray(field.options)) {
                            return field.options.map(option => (
                              <option key={`${field.name}-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ));
                          }
                          return null;
                        })()}
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