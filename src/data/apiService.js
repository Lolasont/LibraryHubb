// Capa de servicios que habla con el backend real.
// Tiene exactamente las mismas firmas que mockService.js, asi las
// paginas pueden cambiar de mock a API sin tocarse para nada.
//
// La URL de la API se toma de la variable VITE_API_URL del archivo .env
// de la raiz. Si no esta, usa el mismo valor por defecto que teniamos.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

// Lee el JWT que AuthContext guardo en el localStorage al iniciar sesion.
function getToken() {
  return localStorage.getItem('libraryhub_token') ?? null
}

// Helper que centraliza la logica de hacer fetch a la API.
// Agrega el token automaticamente y lanza un error si la respuesta no es OK.
async function request(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const data = await res.json()

  if (!res.ok) {
    // Usamos el mensaje del backend si existe, sino el status code generico.
    throw new Error(data.mensaje ?? `Error ${res.status}`)
  }

  return data
}

// ─── AUTH ────────────────────────────────────────────────────

/**
 * Autentica un usuario contra el backend.
 * @returns {{ user, token } | null}
 */
export async function loginUsuario(cedula, password) {
  try {
    return await request('/auth/login', { method: 'POST', body: { cedula, password } })
  } catch {
    return null
  }
}

// ─── CATEGORIAS ──────────────────────────────────────────────

export async function getCategorias() {
  return request('/categorias')
}

// ─── LIBROS ──────────────────────────────────────────────────

export async function getLibros({ busqueda = '', categoria_id = null } = {}) {
  const params = new URLSearchParams()
  if (busqueda)     params.set('busqueda',     busqueda)
  if (categoria_id) params.set('categoria_id', categoria_id)
  return request(`/libros?${params}`)
}

export async function getLibroById(id) {
  try {
    return await request(`/libros/${id}`)
  } catch {
    return null
  }
}

// ─── PRESTAMOS ───────────────────────────────────────────────

export async function getPrestamosActivos() {
  return request('/prestamos/me')
}

export async function getTodosPrestamos() {
  return request('/prestamos')
}

/**
 * Solicita un prestamo para el usuario autenticado.
 * @param {null} _miembro_id - No se usa: el backend obtiene al miembro del JWT.
 *   Se mantiene el parametro para conservar la misma firma que mockService.js.
 * @param {string} libro_id
 */
export async function solicitarPrestamo(_miembro_id, libro_id) {
  try {
    return await request('/prestamos', { method: 'POST', body: { libro_id } })
  } catch (err) {
    return { ok: false, mensaje: err.message }
  }
}

export async function renovarPrestamo(prestamo_id) {
  try {
    return await request(`/prestamos/${prestamo_id}/renovar`, { method: 'PATCH' })
  } catch (err) {
    return { ok: false, mensaje: err.message }
  }
}

export async function registrarDevolucion(prestamo_id) {
  try {
    return await request(`/prestamos/${prestamo_id}/devolver`, { method: 'PATCH' })
  } catch (err) {
    return { ok: false, mensaje: err.message }
  }
}

// ─── RESERVAS ────────────────────────────────────────────────

export async function getReservasByMiembro() {
  return request('/reservas/me')
}

export async function getReservasByLibro(libro_id) {
  return request(`/reservas/libro/${libro_id}`)
}

export async function getTodasReservas() {
  return request('/reservas')
}

/**
 * Crea una reserva para el usuario autenticado.
 * @param {null} _miembro_id - Se conserva la firma de mockService.js.
 * @param {string} libro_id
 */
export async function hacerReserva(_miembro_id, libro_id) {
  try {
    return await request('/reservas', { method: 'POST', body: { libro_id } })
  } catch (err) {
    return { ok: false, mensaje: err.message }
  }
}

export async function cancelarReserva(reserva_id) {
  try {
    return await request(`/reservas/${reserva_id}`, { method: 'DELETE' })
  } catch (err) {
    return { ok: false, mensaje: err.message }
  }
}

// ─── MULTAS ──────────────────────────────────────────────────

export async function getMultasByMiembro() {
  return request('/multas/me')
}

export async function getTodasMultas() {
  return request('/multas')
}

// ─── MIEMBROS (para el bibliotecario) ────────────────────────

export async function getMiembros() {
  return request('/miembros')
}

// ─── UTILIDADES (sin cambios — no dependen del backend) ───────
// Reexportamos getEstadoPrestamo desde mockService.js porque es logica pura
// que no tiene sentido duplicar.
export { getEstadoPrestamo } from './mockService.js'
