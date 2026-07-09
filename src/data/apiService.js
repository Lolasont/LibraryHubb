// Capa de servicios que habla con el backend.
//
// Esta fachada funciona en DOS modos y elige automaticamente:
//
//   - Modo Electron: usa window.libraryHub (expuesto en
//     electron/preload.cjs). El backend son los services importados
//     por main.cjs, ejecutandose en el proceso principal de Electron.
//     Toda la comunicacion es IPC, no hay red.
//
//   - Modo web (navegador): usa fetch contra el servidor Express en
//     http://localhost:3000. La sesion viaja como token en el header
//     'x-session-token'. Se persiste en localStorage (mismo mecanismo
//     que el user, asi no hay que tocar AuthContext).
//
// Las paginas de React (Login, Libros, LibroDetalle, MiPerfil,
// MisReservas, Bibliotecario) siguen llamando a las mismas funciones
// exportadas sin saber en que modo estan. Esa deteccion la hace
// isElectron() de abajo.

// ── Deteccion de entorno ─────────────────────────────────────

// Devuelve true si estamos corriendo dentro de Electron
// (window.libraryHub esta inyectado por el preload). Devuelve false
// si estamos en un navegador normal.
function isElectron() {
  return typeof window !== 'undefined' && !!window.libraryHub
}

// Acceso a la API expuesta por el preload. Solo se usa en modo Electron.
function electronApi() {
  if (!isElectron()) {
    throw new Error('window.libraryHub no esta disponible. Esta pagina debe correr dentro de Electron.')
  }
  return window.libraryHub
}

// ── HTTP helpers (modo web) ─────────────────────────────────

const API_BASE = 'http://localhost:3000/api'

// Lee el token de sesion del localStorage (modo web).
function getToken() {
  try { return localStorage.getItem('libraryhub_token') }
  catch { return null }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem('libraryhub_token', token)
    else localStorage.removeItem('libraryhub_token')
  } catch { /* ignore */ }
}

// Fetch helper. Anade el token al header, parsea JSON, y normaliza
// respuestas de error a { ok: false, mensaje } para que las paginas
// no tengan que distinguir entre error HTTP y error logico.
async function http(path, { method = 'GET', body, query } = {}) {
  let url = `${API_BASE}${path}`
  if (query) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    }
    const s = qs.toString()
    if (s) url += `?${s}`
  }
  const token = getToken()
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-session-token': token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({ ok: false, mensaje: 'Respuesta invalida del servidor.' }))
  if (!res.ok && data.mensaje) {
    return { ok: false, mensaje: data.mensaje }
  }
  return data
}

// Varios endpoints devuelven una lista en el caso normal, pero un objeto
// { ok: false, mensaje } cuando algo sale mal. Las paginas hacen .map()
// directo sobre el resultado, asi que si llegara a colarse ese objeto de
// error en vez de un array, la UI se rompe. Esta funcion normaliza
// cualquier resultado que no sea un array a una lista vacia.
function comoLista(data) {
  return Array.isArray(data) ? data : []
}

// ── AUTH ─────────────────────────────────────────────────────

/**
 * Autentica un usuario contra el backend.
 * Devuelve { user, token } si las credenciales son validas, o null en
 * caso contrario.
 * @returns {Promise<{ user, token } | null>}
 */
export async function loginUsuario(cedula, password) {
  if (isElectron()) {
    const data = await electronApi().login(cedula, password)
    if (!data || data.ok === false) return null
    return { user: data.user, token: null }
  } else {
    const data = await http('/auth/login', {
      method: 'POST',
      body: { cedula, password },
    })
    if (!data || data.ok === false) return null
    // Guardamos el token para futuras requests.
    setToken(data.token)
    return { user: data.user, token: data.token }
  }
}

/**
 * Vuelve a avisarle al backend quien esta logueado, usando el id
 * guardado en localStorage. Hace falta porque la sesion puede haberse
 * perdido (recarga de la ventana, reinicio del server) mientras el
 * renderer todavia recuerda al usuario.
 * @param {string} userId
 * @returns {Promise<{ ok: boolean, user?: object, mensaje?: string }>}
 */
export async function restaurarSesion(userId) {
  if (isElectron()) {
    return electronApi().restaurarSesion(userId)
  } else {
    const data = await http('/auth/restaurar-sesion', {
      method: 'POST',
      body: { userId },
    })
    if (data?.token) setToken(data.token)
    return data
  }
}

/**
 * Cierra la sesion actual. En modo Electron, por ahora es un no-op
 * del lado del backend (no hay canal IPC de logout, y el main.cjs
 * mantiene al usuario en memoria hasta que se reinicia la app). El
 * frontend limpia localStorage y el contexto en AuthContext. En modo
 * web, borra el token del localStorage y le avisa al server.
 */
export async function logoutUsuario() {
  if (isElectron()) {
    return { ok: true }
  } else {
    try { await http('/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    setToken(null)
    return { ok: true }
  }
}

// ── CATEGORIAS ───────────────────────────────────────────────

export async function getCategorias() {
  if (isElectron()) return comoLista(await electronApi().getCategorias())
  return comoLista(await http('/categorias'))
}

// ── LIBROS ───────────────────────────────────────────────────

export async function getLibros({ busqueda = '', categoria_id = null } = {}) {
  if (isElectron()) {
    return comoLista(await electronApi().getLibros({ busqueda, categoria_id }))
  }
  return comoLista(await http('/libros', { query: { busqueda, categoria_id } }))
}

export async function getLibroById(id) {
  if (isElectron()) {
    const data = await electronApi().getLibroById(id)
    if (data?.ok === false) return null
    return data
  }
  const data = await http(`/libros/${id}`)
  if (data?.ok === false) return null
  return data
}

// ── PRESTAMOS ────────────────────────────────────────────────

export async function getPrestamosActivos() {
  if (isElectron()) return comoLista(await electronApi().getPrestamosActivos())
  return comoLista(await http('/prestamos/mis-activos'))
}

export async function getTodosPrestamos() {
  if (isElectron()) return comoLista(await electronApi().getTodosPrestamos())
  return comoLista(await http('/prestamos/todos'))
}

export async function solicitarPrestamo(libro_id) {
  if (isElectron()) return electronApi().solicitarPrestamo(libro_id)
  return http('/prestamos/solicitar', { method: 'POST', body: { libro_id } })
}

export async function renovarPrestamo(prestamo_id) {
  if (isElectron()) return electronApi().renovarPrestamo(prestamo_id)
  return http(`/prestamos/${prestamo_id}/renovar`, { method: 'POST' })
}

export async function registrarDevolucion(prestamo_id) {
  if (isElectron()) return electronApi().registrarDevolucion(prestamo_id)
  return http(`/prestamos/${prestamo_id}/devolver`, { method: 'POST' })
}

// ── RESERVAS ─────────────────────────────────────────────────

export async function getReservasByMiembro() {
  if (isElectron()) return comoLista(await electronApi().getReservasByMiembro())
  return comoLista(await http('/reservas/mis-reservas'))
}

export async function getReservasByLibro(libro_id) {
  if (isElectron()) return comoLista(await electronApi().getReservasByLibro(libro_id))
  return comoLista(await http(`/reservas/por-libro/${libro_id}`))
}

export async function getTodasReservas() {
  if (isElectron()) return comoLista(await electronApi().getTodasReservas())
  return comoLista(await http('/reservas/todas'))
}

export async function hacerReserva(libro_id) {
  if (isElectron()) return electronApi().hacerReserva(libro_id)
  return http('/reservas', { method: 'POST', body: { libro_id } })
}

export async function cancelarReserva(reserva_id) {
  if (isElectron()) return electronApi().cancelarReserva(reserva_id)
  return http(`/reservas/${reserva_id}/cancelar`, { method: 'POST' })
}

// ── MULTAS ───────────────────────────────────────────────────

export async function getMultasByMiembro() {
  if (isElectron()) return comoLista(await electronApi().getMultasByMiembro())
  return comoLista(await http('/multas/mis-multas'))
}

export async function getTodasMultas() {
  if (isElectron()) return comoLista(await electronApi().getTodasMultas())
  return comoLista(await http('/multas/todas'))
}

// ── MIEMBROS (para el bibliotecario) ─────────────────────────

export async function getMiembros() {
  if (isElectron()) return comoLista(await electronApi().getMiembros())
  return comoLista(await http('/miembros'))
}

// ── UTILIDADES (sin cambios — no dependen del backend) ───────
// getEstadoPrestamo es logica pura (no hace fetch), por eso vive en utils.js
// junto al resto de los helpers de formato. Se reexporta aqui para que las
// paginas puedan seguir importandola desde apiService.js sin tocar sus imports.
export { getEstadoPrestamo } from './utils.js'
