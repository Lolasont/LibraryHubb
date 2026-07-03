import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('libraryhub_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Guarda el usuario Y el JWT token
  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem('libraryhub_user', JSON.stringify(userData))
    localStorage.setItem('libraryhub_token', token)
  }

  // Limpia usuario y token
  const logout = () => {
    setUser(null)
    localStorage.removeItem('libraryhub_user')
    localStorage.removeItem('libraryhub_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
