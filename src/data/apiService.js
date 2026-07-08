// Capa de servicios que habla con el proceso principal de Electron
// mediante window.libraryHub (expuesto en electron/preload.cjs).
//
// Antes este archivo hacia fetch a un backend HTTP. Ahora todas las
// llamadas son ipcRenderer.invoke(...) ejecutadas dentro del mismo
// proceso, asi que no hay red, no hay token, no hay URLs.
//
// La fachada publica (nombres de funciones exportadas, parametros y
// tipo de retorno) se mantiene IDENTICA a la version anterior, para
// que las paginas de React (Login, Libros, LibroDetalle, MiPerfil,
// MisReservas, Bibliotecario) no necesiten cambios.

// Acceso a la API expuesta por el preload. window.libraryHub existe
// siempre dentro de Electron; si por algun motivo no esta (por ejemplo,
// si se abre la app en un navegador sin preload) lanzamos un error claro
// al usarlo, en vez de fallar silenciosamente.
function api() {
  if (typeof window === 'undefined' || !window.libraryHub) {
    throw new Error(
      'window.libraryHub no esta disponible. Esta pagina debe correr dentro de Electron.'
    )
  }
  return window.libraryHub
}

// Varios canales IPC devuelven una lista en el caso normal, pero un
// objeto { ok: false, mensaje } cuando algo sale mal (por ejemplo, si la
// sesion del lado de Electron todavia no se restauro — ver
// restaurarSesion mas arriba). Las paginas hacen .map() directo sobre el
// resultado, asi que si llegara a colarse ese objeto de error en vez de
// un array, la interfaz se rompe con un TypeError poco claro. Esta
// funcion normaliza cualquier resultado que no sea un array a una lista
// vacia, para que la pagina simplemente no muestre nada en vez de
// explotar.
function comoLista(data) {
  return Array.isArray(data) ? data : []
}

// ─── AUTH ────────────────────────────────────────────────────

/**
 * Autentica un usuario contra el backend.
 * Devuelve { user, token } si las credenciales son validas, o null en
 * caso contrario (mismo contrato que antes, para no tocar Login.jsx).
 * @returns {Promise<{ user, token } | null>}
 */
export async function loginUsuario(cedula, password) {
  const data = await api().login(cedula, password)
  if (!data || data.ok === false) return null
  return { user: data.user, token: null }
}

/**
 * Vuelve a avisarle al proceso principal de Electron quien esta logueado,
 * usando el id guardado en localStorage. Hace falta porque la sesion
 * "real" vive en memoria del lado de Electron (no en un token), y esa
 * memoria puede perderse (recarga de la ventana, reinicio) mientras el
 * renderer todavia recuerda al usuario.
 * @param {string} userId
 * @returns {Promise<{ ok: boolean, user?: object, mensaje?: string }>}
 */
export async function restaurarSesion(userId) {
  return api().restaurarSesion(userId)
}

// ─── CATEGORIAS ──────────────────────────────────────────────

export async function getCategorias() {
  return comoLista(await api().getCategorias())
}

// ─── LIBROS ──────────────────────────────────────────────────

export async function getLibros({ busqueda = '', categoria_id = null } = {}) {
  return comoLista(await api().getLibros({ busqueda, categoria_id }))
}

export async function getLibroById(id) {
  const data = await api().getLibroById(id)
  // Mismo contrato que antes: si no se encontro el libro, devuelve null.
  if (data && data.ok === false) return null
  return data
}

// ─── PRESTAMOS ───────────────────────────────────────────────

export async function getPrestamosActivos() {
  return comoLista(await api().getPrestamosActivos())
}

export async function getTodosPrestamos() {
  return comoLista(await api().getTodosPrestamos())
}

/**
 * Solicita un prestamo para el usuario autenticado.
 * @param {string} libro_id
 */
export async function solicitarPrestamo(libro_id) {
  return api().solicitarPrestamo(libro_id)
}

export async function renovarPrestamo(prestamo_id) {
  return api().renovarPrestamo(prestamo_id)
}

export async function registrarDevolucion(prestamo_id) {
  return api().registrarDevolucion(prestamo_id)
}

// ─── RESERVAS ────────────────────────────────────────────────

export async function getReservasByMiembro() {
  return comoLista(await api().getReservasByMiembro())
}

export async function getReservasByLibro(libro_id) {
  return comoLista(await api().getReservasByLibro(libro_id))
}

export async function getTodasReservas() {
  return comoLista(await api().getTodasReservas())
}

/**
 * Crea una reserva para el usuario autenticado.
 * @param {string} libro_id
 */
export async function hacerReserva(libro_id) {
  return api().hacerReserva(libro_id)
}

export async function cancelarReserva(reserva_id) {
  return api().cancelarReserva(reserva_id)
}

// ─── MULTAS ──────────────────────────────────────────────────

export async function getMultasByMiembro() {
  return comoLista(await api().getMultasByMiembro())
}

export async function getTodasMultas() {
  return comoLista(await api().getTodasMultas())
}

// ─── MIEMBROS (para el bibliotecario) ────────────────────────

export async function getMiembros() {
  return comoLista(await api().getMiembros())
}

// ─── UTILIDADES (sin cambios — no dependen del backend) ───────
// getEstadoPrestamo es logica pura (no hace fetch), por eso vive en utils.js
// junto al resto de los helpers de formato. Se reexporta aqui para que las
// paginas puedan seguir importandola desde apiService.js sin tocar sus imports.
export { getEstadoPrestamo } from './utils.js'
