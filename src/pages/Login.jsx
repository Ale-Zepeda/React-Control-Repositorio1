import { useAuth } from '../auth.jsx'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      setError(e.message || 'Error')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
          <p className="text-gray-600 mt-2">Control Escolar</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input 
              type="email"
              className="form-input"
              value={email} 
              onChange={e=>setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input 
              type="password" 
              className="form-input"
              value={password} 
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="btn-primary w-full">
            Iniciar Sesión
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Credenciales por defecto: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
