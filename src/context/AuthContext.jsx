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

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { restaurarSesion } from '../data/apiService'

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

  // sesionLista indica si ya se resolvio (con exito o no) el intento de
  // restaurar la sesion del lado de Electron. Si no habia nadie que
  // restaurar, arranca en true de una. Si habia un usuario guardado,
  // arranca en false hasta que el efecto de mas abajo confirme que
  // usuarioActual (sesion.service.js, en el proceso principal) quedo
  // sincronizado. Las rutas protegidas (RequireAuth, en App.jsx) esperan
  // a que esto sea true antes de montar cualquier pagina — si no,
  // paginas como Libros.jsx disparan sus pedidos IPC antes de que
  // Electron sepa quien esta logueado, y todo falla con
  // "No hay una sesion activa."
  const [sesionLista, setSesionLista] = useState(() => {
    try {
      return !localStorage.getItem('libraryhub_user')
    } catch {
      return true
    }
  })

  // login guarda el usuario. El segundo argumento (token) se mantiene por
  // compatibilidad con la firma que usaba Login.jsx, pero ya no se persiste:
  // en IPC no hace falta un token, la sesion vive en memoria del lado de Electron.
  const login = useCallback((userData, _token) => {
    setUser(userData)
    setSesionLista(true)
    localStorage.setItem('libraryhub_user', JSON.stringify(userData))
  }, [])

  // logout limpia el estado y localStorage.
  const logout = useCallback(() => {
    setUser(null)
    setSesionLista(true)
    localStorage.removeItem('libraryhub_user')
  }, [])

  const value = useMemo(() => ({ user, login, logout, sesionLista }), [user, login, logout, sesionLista])

  // Al abrir la app (o recargar la ventana en desarrollo), el proceso
  // principal de Electron arranca sin saber quien esta logueado —
  // usuarioActual (sesion.service.js) empieza en null aunque el renderer
  // todavia tenga un usuario guardado en localStorage. Sin este efecto,
  // cualquier llamada a un canal IPC protegido (getCategorias, getLibros,
  // etc.) fallaria con "No hay una sesion activa." apenas se abre la app,
  // a pesar de que para el usuario la sesion nunca se cerro.
  //
  // Se ejecuta una sola vez al montar. Si la restauracion falla (por
  // ejemplo, la cuenta fue suspendida mientras la app estaba cerrada, o
  // ya no existe), cerramos la sesion localmente para no dejar a la app
  // en un estado a medias (el renderer "cree" que hay usuario, pero
  // ningun canal protegido va a funcionar).
  useEffect(() => {
    if (!user) return

    let cancelado = false

    restaurarSesion(user.id).then((resultado) => {
      if (cancelado) return
      if (!resultado || resultado.ok === false) {
        logout()
        return
      }
      // Refrescamos el usuario con los datos actuales (por si algo
      // cambio del lado del servidor mientras la app estaba cerrada).
      setUser(resultado.user)
      localStorage.setItem('libraryhub_user', JSON.stringify(resultado.user))
    }).catch(() => {
      if (!cancelado) logout()
    }).finally(() => {
      // Pase lo que pase (exito, rechazo, error de red), la sesion ya
      // termino de intentar resolverse: las rutas protegidas pueden
      // dejar de esperar. Sin este finally, un fallo dejaria a la app
      // mostrando el spinner de carga para siempre.
      if (!cancelado) setSesionLista(true)
    })

    return () => { cancelado = true }
    // Solo nos interesa que corra una vez al montar, con el usuario que
    // habia en localStorage en ese momento — no en cada cambio de "user".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
