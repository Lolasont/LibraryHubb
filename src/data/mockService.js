// ============================================================
// MOCK SERVICE — capa de servicios con datos simulados
//
// CÓMO REEMPLAZAR POR API:
//   Cada función devuelve datos directamente ahora.
//   Cuando el backend esté listo, reemplazar el cuerpo de cada
//   función por un fetch/axios a la API correspondiente.
//   Los componentes NO necesitan cambios porque consumen
//   estas funciones, no los datos directamente.
// ============================================================

import {
  libros as _libros,
  usuarios,
  prestamos as _prestamos,
  reservas as _reservas,
  multas as _multas,
  categorias,
} from './mockData'

// Estado mutable de sesión (se resetea al recargar — comportamiento normal sin backend)
let libros     = _libros.map(l => ({ ...l }))
let prestamos  = _prestamos.map(p => ({ ...p }))
let reservas   = _reservas.map(r => ({ ...r }))
let multas     = _multas.map(m => ({ ...m }))
let nextId     = { prestamo: 100, reserva: 100, multa: 100 }

// ─── AUTH ────────────────────────────────────────────────────

/**
 * Autentica un usuario por cédula y contraseña.
 * @returns {object|null} usuario sin password, o null si falla
 */
export function loginUsuario(cedula, password) {
  const usuario = usuarios.find(u => u.cedula === cedula && u.password === password)
  if (!usuario) return null
  const { password: _, ...safe } = usuario
  return safe
}

// ─── CATEGORÍAS ──────────────────────────────────────────────

export function getCategorias() {
  return [...categorias]
}

// ─── LIBROS ──────────────────────────────────────────────────

/**
 * Retorna libros filtrados por búsqueda y/o categoría.
 * @param {object} opts - { busqueda: string, categoria_id: number|null }
 */
export function getLibros({ busqueda = '', categoria_id = null } = {}) {
  return libros.filter(libro => {
    const term = busqueda.toLowerCase().trim()
    const matchBusqueda =
      !term ||
      libro.titulo.toLowerCase().includes(term) ||
      libro.autores.some(a => a.toLowerCase().includes(term)) ||
      libro.isbn.includes(term)
    const matchCategoria = !categoria_id || libro.categoria_id === Number(categoria_id)
    return matchBusqueda && matchCategoria
  })
}

/**
 * Retorna un libro por ID, con info de reservas en cola.
 */
export function getLibroById(id) {
  return libros.find(l => l.id === Number(id)) || null
}

// ─── PRÉSTAMOS ───────────────────────────────────────────────

/**
 * Préstamos activos y vencidos de un miembro.
 */
export function getPrestamosActivos(miembro_id) {
  return prestamos.filter(
    p => p.miembro_id === Number(miembro_id) && p.estado !== 'devuelto'
  )
}

/**
 * Historial completo de préstamos de un miembro.
 */
export function getHistorialPrestamos(miembro_id) {
  return prestamos.filter(p => p.miembro_id === Number(miembro_id))
}

/**
 * Todos los préstamos activos/vencidos (para el bibliotecario).
 */
export function getTodosPrestamos() {
  return prestamos.filter(p => p.estado !== 'devuelto')
}

/**
 * Solicita un préstamo para un miembro sobre un libro.
 * @returns {{ ok: boolean, mensaje: string, prestamo?: object }}
 */
export function solicitarPrestamo(miembro_id, libro_id) {
  const libro = libros.find(l => l.id === Number(libro_id))
  if (!libro || libro.copias_disponibles < 1) {
    return { ok: false, mensaje: 'No hay copias disponibles.' }
  }
  const fechaPrestamo = new Date()
  const fechaVenc = new Date()
  fechaVenc.setDate(fechaVenc.getDate() + 14) // 14 días de préstamo

  const nuevoPrestamo = {
    id: nextId.prestamo++,
    miembro_id: Number(miembro_id),
    libro_id: Number(libro_id),
    libro_titulo: libro.titulo,
    fecha_prestamo: fechaPrestamo.toISOString().split('T')[0],
    fecha_devolucion_esperada: fechaVenc.toISOString().split('T')[0],
    fecha_devolucion: null,
    estado: 'activo',
  }
  prestamos.push(nuevoPrestamo)
  libro.copias_disponibles -= 1
  return { ok: true, mensaje: 'Préstamo registrado con éxito.', prestamo: nuevoPrestamo }
}

/**
 * Renueva un préstamo activo por 14 días más.
 * @returns {{ ok: boolean, mensaje: string }}
 */
export function renovarPrestamo(prestamo_id) {
  const prestamo = prestamos.find(p => p.id === Number(prestamo_id))
  if (!prestamo || prestamo.estado === 'devuelto') {
    return { ok: false, mensaje: 'Préstamo no válido para renovar.' }
  }
  const base = new Date(prestamo.fecha_devolucion_esperada)
  base.setDate(base.getDate() + 14)
  prestamo.fecha_devolucion_esperada = base.toISOString().split('T')[0]
  prestamo.estado = 'activo'
  return { ok: true, mensaje: 'Préstamo renovado por 14 días más.' }
}

/**
 * Registra la devolución de un préstamo (acción de bibliotecario).
 */
export function registrarDevolucion(prestamo_id) {
  const prestamo = prestamos.find(p => p.id === Number(prestamo_id))
  if (!prestamo) return { ok: false, mensaje: 'Préstamo no encontrado.' }
  prestamo.estado = 'devuelto'
  prestamo.fecha_devolucion = new Date().toISOString().split('T')[0]
  const libro = libros.find(l => l.id === prestamo.libro_id)
  if (libro) libro.copias_disponibles += 1
  return { ok: true, mensaje: 'Devolución registrada.' }
}

// ─── RESERVAS ────────────────────────────────────────────────

/**
 * Reservas activas de un miembro.
 */
export function getReservasByMiembro(miembro_id) {
  return reservas.filter(
    r => r.miembro_id === Number(miembro_id) && r.estado === 'reservado'
  )
}

/**
 * Reservas activas de un libro (para mostrar cola en detalle).
 */
export function getReservasByLibro(libro_id) {
  return reservas
    .filter(r => r.libro_id === Number(libro_id) && r.estado === 'reservado')
    .sort((a, b) => a.posicion_cola - b.posicion_cola)
}

/**
 * Todas las reservas activas (para el bibliotecario).
 */
export function getTodasReservas() {
  return reservas.filter(r => r.estado === 'reservado')
}

/**
 * Crea una reserva para un miembro sobre un libro sin copias disponibles.
 * @returns {{ ok: boolean, mensaje: string, reserva?: object }}
 */
export function hacerReserva(miembro_id, libro_id) {
  const yaReservado = reservas.find(
    r => r.miembro_id === Number(miembro_id) && r.libro_id === Number(libro_id) && r.estado === 'reservado'
  )
  if (yaReservado) return { ok: false, mensaje: 'Ya tienes una reserva para este libro.' }

  const libro = libros.find(l => l.id === Number(libro_id))
  if (!libro) return { ok: false, mensaje: 'Libro no encontrado.' }

  const colaActual = reservas.filter(r => r.libro_id === Number(libro_id) && r.estado === 'reservado')
  const posicion = colaActual.length + 1

  const fechaEstimada = new Date()
  fechaEstimada.setDate(fechaEstimada.getDate() + posicion * 14)

  const nuevaReserva = {
    id: nextId.reserva++,
    miembro_id: Number(miembro_id),
    libro_id: Number(libro_id),
    libro_titulo: libro.titulo,
    fecha_reserva: new Date().toISOString().split('T')[0],
    posicion_cola: posicion,
    estado: 'reservado',
    fecha_estimada_disponibilidad: fechaEstimada.toISOString().split('T')[0],
  }
  reservas.push(nuevaReserva)
  return { ok: true, mensaje: `Reserva creada. Estás en posición ${posicion} en la cola.`, reserva: nuevaReserva }
}

/**
 * Cancela una reserva activa.
 */
export function cancelarReserva(reserva_id) {
  const reserva = reservas.find(r => r.id === Number(reserva_id))
  if (!reserva) return { ok: false, mensaje: 'Reserva no encontrada.' }
  reserva.estado = 'cancelado'
  return { ok: true, mensaje: 'Reserva cancelada.' }
}

// ─── MULTAS ──────────────────────────────────────────────────

/**
 * Multas pendientes de un miembro.
 */
export function getMultasByMiembro(miembro_id) {
  return multas.filter(m => m.miembro_id === Number(miembro_id) && !m.pagada)
}

/**
 * Todas las multas pendientes (para el bibliotecario).
 */
export function getTodasMultas() {
  return multas.filter(m => !m.pagada)
}

// ─── MIEMBROS (para bibliotecario) ───────────────────────────

export function getMiembros() {
  return usuarios
    .filter(u => u.rol === 'miembro')
    .map(({ password: _, ...u }) => u)
}

export function getMiembroById(id) {
  const u = usuarios.find(u => u.id === Number(id))
  if (!u) return null
  const { password: _, ...safe } = u
  return safe
}

// ─── UTILIDADES ──────────────────────────────────────────────

/**
 * Determina el estado visual de un préstamo según fecha de vencimiento.
 * @returns {'vencido'|'alerta'|'activo'}
 */
export function getEstadoPrestamo(prestamo) {
  if (prestamo.estado === 'vencido') return 'vencido'
  if (prestamo.estado === 'devuelto') return 'devuelto'
  const hoy = new Date()
  const venc = new Date(prestamo.fecha_devolucion_esperada)
  const diasRestantes = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes <= 5) return 'alerta'
  return 'activo'
}
