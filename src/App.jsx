import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Profesor from './pages/Profesor'
import Tutor from './pages/Tutor'
import Alumno from './pages/Alumno'
import AlumnoQR from './pages/AlumnoQR'
import Scanner from './pages/Scanner'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth, AuthProvider } from './auth.jsx'

function Nav() {
  const { user, logout } = useAuth()
  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-white text-xl font-bold">
              Control Escolar
            </Link>
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link to="/" className="text-blue-200 hover:text-white px-3 py-2 rounded-md">
                  Dashboard
                </Link>
                {user.rol === 'admin' && (
                  <Link to="/admin" className="text-blue-200 hover:text-white px-3 py-2 rounded-md">
                    Admin
                  </Link>
                )}
                {user.rol === 'profesor' && (
                  <Link to="/profesor" className="text-blue-200 hover:text-white px-3 py-2 rounded-md">
                    Profesor
                  </Link>
                )}
                {user.rol === 'tutor' && (
                  <Link to="/tutor" className="text-blue-200 hover:text-white px-3 py-2 rounded-md">
                    Tutor
                  </Link>
                )}
                {user.rol === 'alumno' && (
                  <>
                    <Link to="/alumno" className="text-blue-200 hover:text-white px-3 py-2 rounded-md">
                      Alumno
                    </Link>
                    <Link to="/mi-qr" className="text-blue-200 hover:text-white px-3 py-2 rounded-md">
                      📱 Mi QR
                    </Link>
                  </>
                )}
                {(user.rol === 'admin') && (
                  <Link to="/scanner" className="text-blue-200 hover:text-white px-3 py-2 rounded-md">
                    📷 Scanner
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              <Link to="/login" className="btn-secondary">
                Iniciar Sesión
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-blue-200">
                  Rol: <span className="text-white font-medium">{user.rol}</span>
                </span>
                <button onClick={logout} className="btn-secondary">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
      <Route path="/profesor" element={<ProtectedRoute roles={["profesor","admin"]}><Profesor /></ProtectedRoute>} />
      <Route path="/tutor" element={<ProtectedRoute roles={["tutor","admin"]}><Tutor /></ProtectedRoute>} />
      <Route path="/alumno" element={<ProtectedRoute roles={["alumno","admin"]}><Alumno /></ProtectedRoute>} />
      <Route path="/mi-qr" element={<ProtectedRoute roles={["alumno","admin"]}><AlumnoQR /></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute roles={["admin"]}><Scanner /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AppRoutes />
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}
