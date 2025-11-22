import { useAuth } from '../auth'
import { api } from '../api'
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

export default function AlumnoQR() {
  const { token, user } = useAuth()
  const [qrData, setQrData] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadQRData()
  }, [token, user])

  const getAlumnoId = () => {
    return (
      user?.idAlumno ??
      user?.alumnoId ??
      user?.alumno?.id ??
      user?.id ??
      null
    )
  }

  const loadQRData = async () => {
    const alumnoId = getAlumnoId()
    if (!alumnoId) {
      setError('No se encontró idAlumno en tu sesión. Cierra sesión y vuelve a entrar con la cuenta de alumno.')
      setLoading(false)
      return
    }
    setLoading(true)

    // 1) Cargar QR
    try {
      const qrResponse = await api(`/api/qr/alumno/${alumnoId}`, { token })
      setQrData(qrResponse)
      setError('')
    } catch (e) {
      if (e.status === 404) {
        setQrData(null)
        setError('Aún no tienes un QR. Presiona "Generar QR" para crearlo.')
      } else {
        setError(e.message || 'Error al cargar el QR')
      }
    }

    // 2) Cargar historial (ignorar 404) - usar ruta principal por alumnos y fallback a qr
    try {
      const historialResponse = await api(`/api/alumnos/${alumnoId}/asistencias`, { token })
      setHistorial(historialResponse || [])
    } catch (e) {
      if (e.status === 404) {
        try {
          const alt = await api(`/api/qr/asistencias/alumno/${alumnoId}`, { token })
          setHistorial(alt || [])
        } catch (e2) {
          if (e2.status === 404) setHistorial([])
          else console.error('Error cargando historial:', e2)
        }
      } else {
        console.error('Error cargando historial:', e)
      }
    } finally {
      setLoading(false)
    }
  }

  const generarNuevoQR = async () => {
    const alumnoId = getAlumnoId()
    if (!alumnoId) {
      setError('No se puede generar QR: falta idAlumno')
      return
    }
    try {
      const response = await api('/api/qr/generar', {
        method: 'POST',
        body: { idAlumnos: [alumnoId], idAlumno: alumnoId, id_alumno: alumnoId, alumnoId },
        token
      })
      setQrData(response)
      setError('')
    } catch (e) {
      // Intentar endpoint alterno si el backend usa ruta con parámetro
      if (e.status === 400 || e.status === 404) {
        try {
          const resp2 = await api(`/api/qr/alumno/${alumnoId}/generar`, {
            method: 'POST',
            token
          })
          setQrData(resp2)
          setError('')
          return
        } catch (e2) {
          setError((e2.details?.error || e2.message) || 'Error al generar el QR')
          return
        }
      }
      setError((e.details?.error || e.message) || 'Error al generar el QR')
    }
  }

  const regenerarQR = async () => {
    if (window.confirm('¿Regenerar código QR? El anterior dejará de funcionar.')) {
      setLoading(true)
      await generarNuevoQR()
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu código QR...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Mi Código QR</h1>
          <p className="text-center text-gray-600">Presenta este código al ingresar y salir</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 break-words">
            {error}
          </div>
        )}

        {/* Si no hay QR todavía, ofrecer generarlo */}
        {!qrData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
            <p className="text-gray-700 mb-4">No tienes un código QR activo.</p>
            <button
              onClick={generarNuevoQR}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
            >
              ➕ Generar QR
            </button>
          </div>
        )}

        {/* QR Code Display */}
        {qrData && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center">
              {/* QR Image */}
              <div className="bg-gray-50 p-8 rounded-lg mb-4">
                {qrData.qrImage ? (
                  <img 
                    src={`data:image/png;base64,${qrData.qrImage}`}
                    alt="Código QR"
                    className="mx-auto w-64 h-64 object-contain"
                  />
                ) : (
                  <div className="mx-auto" style={{ width: 256 }}>
                    <QRCode
                      value={qrData.codigoQR || ''}
                      size={256}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    />
                  </div>
                )}
              </div>
              
              {/* QR Info */}
              <div className="text-sm text-gray-600 mb-4">
                <p><strong>Código:</strong> {qrData.codigoQR}</p>
                <p><strong>Creado:</strong> {new Date(qrData.fechaCreacion).toLocaleDateString()}</p>
                {qrData.fechaExpiracion && (
                  <p><strong>Expira:</strong> {new Date(qrData.fechaExpiracion).toLocaleDateString()}</p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={regenerarQR}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                  🔄 Regenerar QR
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Mi Código QR Escolar',
                          text: `Código QR: ${qrData.codigoQR}`,
                        })
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm"
                  >
                    📤 Compartir
                  </button>
                  
                  <button
                    onClick={loadQRData}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium text-sm"
                  >
                    🔄 Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Presenta este QR al entrar a la escuela</li>
            <li>• También úsalo al salir</li>
            <li>• Mantén la pantalla limpia y brillante</li>
            <li>• Tu tutor recibirá notificación automática</li>
          </ul>
        </div>

        {/* Recent History */}
        {historial.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Historial Reciente</h3>
            <div className="space-y-3">
              {historial.slice(0, 5).map((registro, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      registro.tipoMovimiento === 'entrada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {registro.tipoMovimiento === 'entrada' ? '🟢 Entrada' : '🔵 Salida'}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{new Date(registro.fechaHora).toLocaleDateString()}</div>
                    <div>{new Date(registro.fechaHora).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            qrData?.activo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              qrData?.activo ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {qrData?.activo ? 'QR Activo' : 'QR Inactivo'}
          </div>
        </div>
      </div>
    </div>
  )
}
