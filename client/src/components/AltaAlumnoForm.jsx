import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'

export default function AltaAlumnoForm() {
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [grupos, setGrupos] = useState([])
  const [especialidades, setEspecialidades] = useState([])

  const [alumnoUsuario, setAlumnoUsuario] = useState({
    nombre: '', Ap: '', Am: '',
    calle: '', colonia: '', numero: '', cp: '', telefono: '',
    email: '', password: '', genero: '', curp: ''
  })
  const [alumno, setAlumno] = useState({ 
    especialidad: '',
    semestre: '',
    turno: 'matutino'
  })
  const [tutorMode, setTutorMode] = useState('existente') // 'existente' | 'nuevo'
  const [tutorEmail, setTutorEmail] = useState('')
  const [tutorUsuario, setTutorUsuario] = useState({
    nombre: '', Ap: '', Am: '',
    calle: '', colonia: '', numero: '', cp: '', telefono: '',
    email: '', password: ''
  })

  // Cargar especialidades disponibles
  useEffect(() => {
    const loadEspecialidades = async () => {
      try {
        const res = await api('/api/grupos/especialidades', { token });
        setEspecialidades(res || []);
      } catch (e) {
        console.error('Error cargando especialidades:', e.message || e);
      }
    }
    if (token) {
      loadEspecialidades();
    }
  }, [token]);

  const submit = async () => {
    setError('')
    
    try {
      // Validar datos del tutor antes de enviar
      if (tutorMode === 'existente') {
        if (!tutorEmail) {
          setError('Por favor ingrese el email del tutor');
          return;
        }
        if (!tutorEmail.includes('@')) {
          setError('Por favor ingrese un email válido para el tutor');
          return;
        }
      }
      
      if (tutorMode === 'nuevo') {
        const camposRequeridosTutor = ['nombre', 'Ap', 'Am', 'email', 'password'];
        const faltantesTutor = camposRequeridosTutor.filter(campo => !tutorUsuario[campo]);
        if (faltantesTutor.length > 0) {
          setError(`Por favor complete los siguientes campos del tutor: ${faltantesTutor.join(', ')}`);
          return;
        }
        if (!tutorUsuario.email.includes('@')) {
          setError('Por favor ingrese un email válido para el tutor');
          return;
        }
      }

      setLoading(true);

      const body = {
        alumnoUsuario,
        alumno,
        tutor: tutorMode === 'existente'
          ? { email: tutorEmail }  // Para tutor existente solo enviamos el email
          : { usuario: tutorUsuario }  // Para nuevo tutor enviamos todos los datos
      };
      
      console.log('Enviando datos:', body); // Para depuración
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
            <select
              className="input"
              value={alumnoUsuario.genero}
              onChange={e => setAlumnoUsuario({...alumnoUsuario, genero: e.target.value})}
              required
            >
              <option value="">Seleccionar Género</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
            <input 
              className="input" 
              placeholder="CURP" 
              value={alumnoUsuario.curp || ''} 
              onChange={e => {
                const curp = e.target.value.toUpperCase();
                if (curp === '' || /^[A-Z0-9]{0,18}$/.test(curp)) {
                  setAlumnoUsuario({...alumnoUsuario, curp: curp})
                }
              }}
              pattern="^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$"
              title="CURP válida (18 caracteres). Por favor ingrese una CURP válida. Ejemplo: SABC901234HDFXYZ01"
              maxLength={18}
            />
            <input className="input" placeholder="Email" type="email" value={alumnoUsuario.email} onChange={e=>setAlumnoUsuario({...alumnoUsuario, email:e.target.value})} />
            <input className="input" placeholder="Contraseña" type="password" value={alumnoUsuario.password} onChange={e=>setAlumnoUsuario({...alumnoUsuario, password:e.target.value})} />
            <select 
              className="input" 
              value={alumno.especialidad} 
              onChange={e => setAlumno({...alumno, especialidad: e.target.value})}
              required
            >
              <option value="">Seleccionar Especialidad</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
            <select 
              className="input" 
              value={alumno.semestre} 
              onChange={e => setAlumno({...alumno, semestre: e.target.value})}
              required
            >
              <option value="">Seleccionar Semestre</option>
              <option value="1">1° Semestre</option>
              <option value="2">2° Semestre</option>
              <option value="3">3° Semestre</option>
              <option value="4">4° Semestre</option>
              <option value="5">5° Semestre</option>
              <option value="6">6° Semestre</option>
            </select>
            <select 
              className="input" 
              value={alumno.turno} 
              onChange={e => setAlumno({...alumno, turno: e.target.value})}
              required
            >
              <option value="">Seleccionar Turno</option>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 mt-4">
            <button 
              className="btn"
              onClick={() => {
                // Validar campos obligatorios del alumno antes de continuar
                const camposRequeridos = [
                  'nombre', 'Ap', 'Am', 'email', 'password', 'genero', 'curp'
                ];
                const faltantes = camposRequeridos.filter(campo => !alumnoUsuario[campo]);
                
                if (faltantes.length > 0) {
                  setError(`Por favor complete los siguientes campos obligatorios: ${faltantes.join(', ')}`);
                  return;
                }
                
                if (!alumno.especialidad || !alumno.semestre || !alumno.turno) {
                  setError('Por favor seleccione especialidad, semestre y turno');
                  return;
                }

                setError('');
                setStep(2);
              }}
            >
              Siguiente - Asignar Tutor
            </button>
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

          <div className="flex justify-between mt-4">
            <button className="btn-secondary" onClick={()=>setStep(1)}>Atrás</button>
            <button 
              className="btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" 
              disabled={loading} 
              onClick={submit}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
