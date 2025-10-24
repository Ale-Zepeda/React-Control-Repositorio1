import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'

export default function AltaAlumnoForm() {
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [alumnoUsuario, setAlumnoUsuario] = useState({
    nombre: '', Ap: '', Am: '',
    calle: '', colonia: '', numero: '', cp: '', telefono: '',
    email: '', password: ''
  })
  const [alumno, setAlumno] = useState({ idGrupo: 1, turno: 'matutino' })
  const [tutorMode, setTutorMode] = useState('existente') // 'existente' | 'nuevo'
  const [tutorEmail, setTutorEmail] = useState('')
  const [tutorUsuario, setTutorUsuario] = useState({
    nombre: '', Ap: '', Am: '',
    calle: '', colonia: '', numero: '', cp: '', telefono: '',
    email: '', password: ''
  })

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const body = {
        alumnoUsuario,
        alumno,
        tutor: tutorMode === 'existente'
          ? { mode: 'existente', email: tutorEmail }
          : { mode: 'nuevo', usuario: tutorUsuario }
      }
      const resp = await api('/api/alumnos/alta-completa', { method: 'POST', body, token })
      setResult(resp)
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 3) return (
    <div className="bg-green-50 border border-green-200 rounded p-4">
      <div className="font-semibold text-green-800 mb-2">Alta completada</div>
      <div className="text-sm text-green-900">Alumno ID: {result?.idAlumno} — Tutor Usuario ID: {result?.idUsuarioTutor || 'N/A'}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {step === 1 && (
        <div className="bg-white shadow rounded p-4 space-y-4">
          <h3 className="text-lg font-semibold">Paso 1: Datos del Alumno</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Nombre" value={alumnoUsuario.nombre} onChange={e=>setAlumnoUsuario({...alumnoUsuario, nombre:e.target.value})} />
            <input className="input" placeholder="Apellido Paterno" value={alumnoUsuario.Ap} onChange={e=>setAlumnoUsuario({...alumnoUsuario, Ap:e.target.value})} />
            <input className="input" placeholder="Apellido Materno" value={alumnoUsuario.Am} onChange={e=>setAlumnoUsuario({...alumnoUsuario, Am:e.target.value})} />
            <input className="input" placeholder="Calle" value={alumnoUsuario.calle} onChange={e=>setAlumnoUsuario({...alumnoUsuario, calle:e.target.value})} />
            <input className="input" placeholder="Colonia" value={alumnoUsuario.colonia} onChange={e=>setAlumnoUsuario({...alumnoUsuario, colonia:e.target.value})} />
            <input className="input" placeholder="Número" value={alumnoUsuario.numero} onChange={e=>setAlumnoUsuario({...alumnoUsuario, numero:e.target.value})} />
            <input className="input" placeholder="CP" type="number" value={alumnoUsuario.cp} onChange={e=>setAlumnoUsuario({...alumnoUsuario, cp:e.target.value})} />
            <input className="input" placeholder="Teléfono" type="number" value={alumnoUsuario.telefono} onChange={e=>setAlumnoUsuario({...alumnoUsuario, telefono:e.target.value})} />
            <input className="input" placeholder="Email" type="email" value={alumnoUsuario.email} onChange={e=>setAlumnoUsuario({...alumnoUsuario, email:e.target.value})} />
            <input className="input" placeholder="Contraseña" type="password" value={alumnoUsuario.password} onChange={e=>setAlumnoUsuario({...alumnoUsuario, password:e.target.value})} />
            <input className="input" placeholder="ID Grupo" type="number" value={alumno.idGrupo} onChange={e=>setAlumno({...alumno, idGrupo: Number(e.target.value)})} />
            <select className="input" value={alumno.turno} onChange={e=>setAlumno({...alumno, turno: e.target.value})}>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button className="btn" onClick={()=>setStep(2)}>Siguiente</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white shadow rounded p-4 space-y-4">
          <h3 className="text-lg font-semibold">Paso 2: Datos del Tutor</h3>
          <div className="flex space-x-3">
            <button onClick={()=>setTutorMode('existente')} className={`px-3 py-1 rounded ${tutorMode==='existente'?'bg-blue-600 text-white':'bg-gray-200'}`}>Tutor existente</button>
            <button onClick={()=>setTutorMode('nuevo')} className={`px-3 py-1 rounded ${tutorMode==='nuevo'?'bg-blue-600 text-white':'bg-gray-200'}`}>Crear nuevo tutor</button>
          </div>

          {tutorMode === 'existente' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input" placeholder="Email del Tutor" type="email" value={tutorEmail} onChange={e=>setTutorEmail(e.target.value)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input" placeholder="Nombre del Tutor" value={tutorUsuario.nombre} onChange={e=>setTutorUsuario({...tutorUsuario, nombre:e.target.value})} />
              <input className="input" placeholder="Apellido Paterno Tutor" value={tutorUsuario.Ap} onChange={e=>setTutorUsuario({...tutorUsuario, Ap:e.target.value})} />
              <input className="input" placeholder="Apellido Materno Tutor" value={tutorUsuario.Am} onChange={e=>setTutorUsuario({...tutorUsuario, Am:e.target.value})} />
              <input className="input" placeholder="Calle" value={tutorUsuario.calle} onChange={e=>setTutorUsuario({...tutorUsuario, calle:e.target.value})} />
              <input className="input" placeholder="Colonia" value={tutorUsuario.colonia} onChange={e=>setTutorUsuario({...tutorUsuario, colonia:e.target.value})} />
              <input className="input" placeholder="Número" value={tutorUsuario.numero} onChange={e=>setTutorUsuario({...tutorUsuario, numero:e.target.value})} />
              <input className="input" placeholder="CP" type="number" value={tutorUsuario.cp} onChange={e=>setTutorUsuario({...tutorUsuario, cp:e.target.value})} />
              <input className="input" placeholder="Teléfono" type="number" value={tutorUsuario.telefono} onChange={e=>setTutorUsuario({...tutorUsuario, telefono:e.target.value})} />
              <input className="input" placeholder="Email del Tutor" type="email" value={tutorUsuario.email} onChange={e=>setTutorUsuario({...tutorUsuario, email:e.target.value})} />
              <input className="input" placeholder="Contraseña del Tutor" type="password" value={tutorUsuario.password} onChange={e=>setTutorUsuario({...tutorUsuario, password:e.target.value})} />
            </div>
          )}

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={()=>setStep(1)}>Atrás</button>
            <button className="btn" disabled={loading} onClick={submit}>{loading?'Guardando...':'Guardar'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
