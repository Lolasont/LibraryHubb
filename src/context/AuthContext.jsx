// Contexto de autenticacion.
// Mantiene en memoria los datos del usuario logueado. Antes ademas
// guardaba un token JWT, pero con la migracion a IPC ese token ya no
// existe: la identidad del usuario vive en memoria del proceso
// principal de Electron (server/services/sesion.service.js).
//
// El objeto user se persiste en localStorage para que la sesion
// sobreviva a recargas del navegador y a reinicios de la app
// (decision 2.2 del plan: "si persiste").

// ──────────────────────────────────────────────────────────────────
// AMPLIACION DEL ALCANCE ORIGINAL
// El enunciado del caso no exigia autenticacion real ni manejo de roles;
// bastaba con un frontend de consulta. El sistema de login y roles
// (socio / bibliotecario) se agrego como ampliacion del alcance.
// Se conserva porque esta completamente integrado al resto del sistema
// (services, paginas protegidas, panel del bibliotecario).
// ──────────────────────────────────────────────────────────────────

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

  // login guarda el usuario. El segundo argumento (token) se mantiene por
  // compatibilidad con la firma que usaba Login.jsx, pero ya no se persiste:
  // en IPC no hace falta un token, la sesion vive en memoria del lado de Electron.
  const login = useCallback((userData, _token) => {
    setUser(userData)
    localStorage.setItem('libraryhub_user', JSON.stringify(userData))
  }, [])

  // logout limpia el estado y localStorage.
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('libraryhub_user')
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
