import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

export default function Scanner() {
  const [scanMode, setScanMode] = useState('entrada') // 'entrada' o 'salida'
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [historialHoy, setHistorialHoy] = useState([])
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [stats, setStats] = useState({ entradas: 0, salidas: 0 })
  
  const inputRef = useRef(null)

  useEffect(() => {
    loadTodayStats()
    // Auto-focus en el input para escáner
    if (inputRef.current) {
      inputRef.current.focus()
    }
    
    // Recargar estadísticas cada 30 segundos
    const interval = setInterval(loadTodayStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await api(`/api/asistencias/dia/${today}`)
      
      setHistorialHoy(response.registros || [])
      setStats({
        entradas: response.registros?.filter(r => r.tipoMovimiento === 'entrada').length || 0,
        salidas: response.registros?.filter(r => r.tipoMovimiento === 'salida').length || 0
      })
    } catch (e) {
      console.error('Error loading stats:', e)
    }
  }

  const procesarEscaneo = async (codigoQR) => {
    if (!codigoQR.trim()) return

    setScanning(true)
    setError('')

    try {
      const response = await api('/api/qr/escanear', {
        method: 'POST',
        body: {
          codigoQR: codigoQR.trim(),
          tipoMovimiento: scanMode,
          dispositivo: 'Scanner-Web-01',
          ubicacion: 'Entrada Principal'
        }
      })

      // Éxito
      setLastScan({
        ...response,
        timestamp: new Date(),
        tipo: scanMode
      })

      // Reproducir sonido de éxito
      playSuccessSound()

      // Limpiar input manual
      setManualCode('')
      
      // Recargar estadísticas
      loadTodayStats()

      // Auto-limpiar después de 3 segundos
      setTimeout(() => {
        setLastScan(null)
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 3000)

    } catch (e) {
      setError(e.message)
      playErrorSound()
      
      setTimeout(() => {
        setError('')
      }, 5000)
    } finally {
      setScanning(false)
    }
  }

  const playSuccessSound = () => {
    // Crear un sonido simple usando Web Audio API
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
    
    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.5)
  }

  const playErrorSound = () => {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    
    oscillator.frequency.value = 300
    oscillator.type = 'sawtooth'
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)
    
    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.3)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      procesarEscaneo(manualCode)
    }
  }

  const toggleMode = () => {
    setScanMode(scanMode === 'entrada' ? 'salida' : 'entrada')
    setLastScan(null)
    setError('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏫 Scanner Control Escolar</h1>
          <div className="text-sm text-gray-300">
            {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Principal de Escaneo */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Selector de Modo */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-center mb-6">
                <div className="bg-gray-700 rounded-lg p-1 flex">
                  <button
                    onClick={toggleMode}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                      scanMode === 'entrada'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    🟢 ENTRADA
                  </button>
                  <button
                    onClick={toggleMode}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                      scanMode === 'salida'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    🔵 SALIDA
                  </button>
                </div>
              </div>

              {/* Área de Escaneo */}
              <div className="text-center">
                <div className={`inline-block p-8 rounded-lg border-4 border-dashed transition-all ${
                  scanning 
                    ? 'border-yellow-400 bg-yellow-900/20' 
                    : scanMode === 'entrada'
                    ? 'border-green-400 bg-green-900/20'
                    : 'border-blue-400 bg-blue-900/20'
                }`}>
                  <div className="text-6xl mb-4">
                    {scanning ? '⏳' : scanMode === 'entrada' ? '🟢' : '🔵'}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {scanning 
                      ? 'Procesando...' 
                      : `Modo ${scanMode.toUpperCase()}`
                    }
                  </h2>
                  <p className="text-gray-300">
                    {scanning 
                      ? 'Registrando asistencia...'
                      : 'Escanea el código QR o ingresa manualmente'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Input Manual */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📝 Entrada Manual</h3>
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escanea QR o escribe código..."
                  disabled={scanning}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => procesarEscaneo(manualCode)}
                  disabled={scanning || !manualCode.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {scanning ? '⏳' : '✓'}
                </button>
              </div>
            </div>

            {/* Resultado del Último Escaneo */}
            {lastScan && (
              <div className="bg-green-800 border border-green-600 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">✅</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-100">
                      {lastScan.tipo === 'entrada' ? 'Entrada Registrada' : 'Salida Registrada'}
                    </h3>
                    <p className="text-green-200 text-lg">{lastScan.alumno}</p>
                    <p className="text-green-300 text-sm">
                      {lastScan.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-800 border border-red-600 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">❌</div>
                  <div>
                    <h3 className="text-xl font-bold text-red-100">Error</h3>
                    <p className="text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel de Estadísticas */}
          <div className="space-y-6">
            
            {/* Estadísticas del Día */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Hoy</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Entradas:</span>
                  <span className="text-2xl font-bold text-green-400">{stats.entradas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Salidas:</span>
                  <span className="text-2xl font-bold text-blue-400">{stats.salidas}</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">En la escuela:</span>
                    <span className="text-2xl font-bold text-yellow-400">
                      {stats.entradas - stats.salidas}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🕐 Actividad Reciente</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {historialHoy.slice(0, 15).map((registro, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className={`w-3 h-3 rounded-full ${
                      registro.tipoMovimiento === 'entrada' ? 'bg-green-400' : 'bg-blue-400'
                    }`}></div>
                    <div className="flex-1">
                      <div className="font-medium">{registro.nombreAlumno}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(registro.fechaHora).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      registro.tipoMovimiento === 'entrada'
                        ? 'bg-green-900 text-green-200'
                        : 'bg-blue-900 text-blue-200'
                    }`}>
                      {registro.tipoMovimiento}
                    </div>
                  </div>
                ))}
                
                {historialHoy.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No hay registros hoy
                  </div>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">⚙️ Controles</h3>
              <div className="space-y-3">
                <button
                  onClick={loadTodayStats}
                  className="w-full bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg transition-colors"
                >
                  🔄 Actualizar
                </button>
                <button
                  onClick={toggleMode}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg transition-colors"
                >
                  🔄 Cambiar Modo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}