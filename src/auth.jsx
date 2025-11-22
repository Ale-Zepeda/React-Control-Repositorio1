import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const login = async (email, password) => {
    try {
      console.log('Intentando login con:', { email, password })
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } })
      console.log('Respuesta del servidor:', data)
      setToken(data.token)
      setUser(data.usuario)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.usuario))
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = { token, user, login, logout }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
