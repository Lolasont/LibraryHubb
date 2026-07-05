// Contexto de autenticacion.
// Mantiene en memoria los datos del usuario logueado y el token JWT
// que se envia en cada peticion a la API.
//
// Los datos se persisten en localStorage para que la sesion sobreviva
// a recargas del navegador. El token vive en una clave aparte para
// que apiService.js lo pueda leer sin necesidad de importar este contexto.

import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Inicializamos el estado leyendo del localStorage. Si no hay nada, queda como null.
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('libraryhub_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // login guarda el usuario y el token. Lo llama el componente Login
  // despues de que el backend responde con { user, token }.
  const login = useCallback((userData, token) => {
    setUser(userData)
    localStorage.setItem('libraryhub_user', JSON.stringify(userData))
    localStorage.setItem('libraryhub_token', token)
  }, [])

  // logout limpia el estado y localStorage.
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('libraryhub_user')
    localStorage.removeItem('libraryhub_token')
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Validamos la prop children para que el provider se use siempre con elementos adentro.
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Hook para usar el contexto desde cualquier componente.
// Si se llama fuera del provider, tira un error explicito.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
