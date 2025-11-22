import { useAuth } from '../auth.jsx'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  
  const menuItems = user?.rol === 'admin' ? [
    { role: 'admin', title: 'Panel Administrador', path: '/admin', icon: '⚙️', description: 'Gestión completa del sistema' },
    { role: 'admin', title: 'Alumnos', path: '/alumnos', icon: '👨‍🎓', description: 'Gestión de alumnos' },
    { role: 'admin', title: 'Scanner QR', path: '/scanner', icon: '📷', description: 'Escanear códigos QR para asistencia' }
  ] : [
    { role: 'profesor', title: 'Panel Profesor', path: '/profesor', icon: '👨‍🏫', description: 'Gestión de clases y calificaciones' },
    { role: 'tutor', title: 'Panel Tutor', path: '/tutor', icon: '👥', description: 'Seguimiento de alumnos' },
    { role: 'alumno', title: 'Panel Alumno', path: '/alumno', icon: '🎓', description: 'Consulta de información académica' },
    { role: 'alumno', title: 'Mi QR', path: '/mi-qr', icon: '📱', description: 'Ver mi código QR' }
  ]
  
  return (
    <div>
      {!user ? (
        <div className="text-center py-12">
          <div className="card max-w-md mx-auto p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bienvenido</h2>
            <p className="text-gray-600 mb-6">Inicie sesión para acceder al sistema de Control Escolar</p>
            <Link to="/login" className="btn-primary">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Bienvenido, <span className="font-medium">{user.nombre || user.email}</span>
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {user.rol === 'admin' ? '👑 Administrador' : 
                 user.rol === 'profesor' ? '👨‍🏫 Profesor' :
                 user.rol === 'tutor' ? '👥 Tutor' : '🎓 Alumno'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems
              .filter(item => user.rol === item.role)
              .map((item, index) => (
                <Link key={index} to={item.path} className="card p-6 hover:shadow-lg transition-shadow group">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{item.icon}</span>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                  <div className="mt-4 text-blue-600 group-hover:text-blue-800 text-sm font-medium">
                    Acceder →
                  </div>
                </Link>
              ))
            }
          </div>
          
          <div className="mt-12">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 text-center hover:bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm text-gray-700">Reportes</div>
                </button>
                <button className="p-4 text-center hover:bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm text-gray-700">Calendario</div>
                </button>
                <button className="p-4 text-center hover:bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-sm text-gray-700">Avisos</div>
                </button>
                <button className="p-4 text-center hover:bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="text-sm text-gray-700">Configuración</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
