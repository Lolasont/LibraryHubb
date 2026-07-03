// ============================================================
// API SERVICE — reemplaza mockService.js con llamadas reales.
// Mismas firmas de función, ahora async.
// Requiere VITE_API_URL en .env (por defecto http://localhost:5000/api)
// ============================================================

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

// Lee el JWT almacenado por AuthContext
function getToken() {
  return localStorage.getItem('libraryhub_token') ?? null
}

// Helper interno para todas las requests
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
    throw new Error(data.mensaje ?? `Error ${res.status}`)
  }

  return data
}

// ─── AUTH ────────────────────────────────────────────────────

/**
 * Autentica un usuario.
 * @returns {{ user, token } | null}
 */
export async function loginUsuario(cedula, password) {
  try {
    return await request('/auth/login', { method: 'POST', body: { cedula, password } })
  } catch {
    return null
  }
}

// ─── CATEGORÍAS ──────────────────────────────────────────────

export async function getCategorias() {
  return request('/categorias')
}

// ─── LIBROS ──────────────────────────────────────────────────

export async function getLibros({ busqueda = '', categoria_id = null } = {}) {
  const params = new URLSearchParams()
  if (busqueda)    params.set('busqueda',    busqueda)
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

// ─── PRÉSTAMOS ───────────────────────────────────────────────

export async function getPrestamosActivos() {
  return request('/prestamos/me')
}

export async function getTodosPrestamos() {
  return request('/prestamos')
}

export async function solicitarPrestamo(_miembro_id, libro_id) {
  try {
    // miembro_id viene del JWT en el backend — no se necesita enviarlo
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

// ─── MIEMBROS (bibliotecario) ─────────────────────────────────

export async function getMiembros() {
  return request('/miembros')
}

// ─── UTILIDADES (sin cambios — no dependen del backend) ───────

export { getEstadoPrestamo } from './mockService.js'
