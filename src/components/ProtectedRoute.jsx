import { useAuth } from '../auth.jsx'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ roles = [], children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (roles.length && !roles.includes(user.rol)) return <Navigate to="/" />
  return children
}
