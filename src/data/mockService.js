// Servicio con datos simulados en memoria.
// Sirve para trabajar el frontend sin tener que levantar el backend
// ni MongoDB. Las paginas no usan este archivo directamente: en su
// lugar importan de apiService.js, que tiene exactamente las mismas
// firmas pero hace fetch a la API real.
//
// Para volver al modo mock sin tocar el codigo de las paginas, basta
// con cambiar la importacion en apiService.js para que use este archivo.

import {
  libros as _libros,
  usuarios,
  prestamos as _prestamos,
  reservas as _reservas,
  multas as _multas,
  categorias,
} from './mockData'

// Copias de los arrays originales para poder mutarlos (los originales
// quedan intactos entre recargas).
const libros     = _libros.map(l => ({ ...l }))
const prestamos  = _prestamos.map(p => ({ ...p }))
const reservas   = _reservas.map(r => ({ ...r }))
const multas     = _multas.map(m => ({ ...m }))
// Contadores para asignar ids a registros nuevos.
const nextId     = { prestamo: 100, reserva: 100, multa: 100 }

// Quita el campo password de un usuario antes de devolverlo al frontend.
function omitPassword(usuario) {
  const safe = { ...usuario }
  delete safe.password
  return safe
}

// ─── AUTH ────────────────────────────────────────────────────

/**
 * Autentica un usuario por cedula y contrasena.
 * @returns {object|null} usuario sin password, o null si falla.
 */
export function loginUsuario(cedula, password) {
  const usuario = usuarios.find(u => u.cedula === cedula && u.password === password)
  if (!usuario) return null
  return omitPassword(usuario)
}

// ─── CATEGORIAS ──────────────────────────────────────────────

export function getCategorias() {
  return [...categorias]
}

// ─── LIBROS ──────────────────────────────────────────────────

/**
 * Devuelve los libros filtrados por busqueda y/o categoria.
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
 * Devuelve un libro por su id, o null si no existe.
 */
export function getLibroById(id) {
  return libros.find(l => l.id === Number(id)) || null
}

// ─── PRESTAMOS ───────────────────────────────────────────────

/**
 * Prestamos activos y vencidos de un socio.
 */
export function getPrestamosActivos(miembro_id) {
  return prestamos.filter(
    p => p.miembro_id === Number(miembro_id) && p.estado !== 'devuelto'
  )
}

/**
 * Historial completo de prestamos de un socio.
 */
export function getHistorialPrestamos(miembro_id) {
  return prestamos.filter(p => p.miembro_id === Number(miembro_id))
}

/**
 * Todos los prestamos activos o vencidos (para el bibliotecario).
 */
export function getTodosPrestamos() {
  return prestamos.filter(p => p.estado !== 'devuelto')
}

/**
 * Crea un prestamo para un socio sobre un libro.
 * @returns {{ ok: boolean, mensaje: string, prestamo?: object }}
 */
export function solicitarPrestamo(miembro_id, libro_id) {
  const libro = libros.find(l => l.id === Number(libro_id))
  if (!libro || libro.copias_disponibles < 1) {
    return { ok: false, mensaje: 'No hay copias disponibles.' }
  }
  const fechaPrestamo = new Date()
  const fechaVenc = new Date()
  fechaVenc.setDate(fechaVenc.getDate() + 14)  // 14 dias de prestamo

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
  return { ok: true, mensaje: 'Prestamo registrado con exito.', prestamo: nuevoPrestamo }
}

/**
 * Renueva un prestamo activo por 14 dias mas.
 * @returns {{ ok: boolean, mensaje: string }}
 */
export function renovarPrestamo(prestamo_id) {
  const prestamo = prestamos.find(p => p.id === Number(prestamo_id))
  if (!prestamo || prestamo.estado === 'devuelto') {
    return { ok: false, mensaje: 'Prestamo no valido para renovar.' }
  }
  const base = new Date(prestamo.fecha_devolucion_esperada)
  base.setDate(base.getDate() + 14)
  prestamo.fecha_devolucion_esperada = base.toISOString().split('T')[0]
  prestamo.estado = 'activo'
  return { ok: true, mensaje: 'Prestamo renovado por 14 dias mas.' }
}

/**
 * Registra la devolucion de un prestamo. Accion del bibliotecario.
 */
export function registrarDevolucion(prestamo_id) {
  const prestamo = prestamos.find(p => p.id === Number(prestamo_id))
  if (!prestamo) return { ok: false, mensaje: 'Prestamo no encontrado.' }
  prestamo.estado = 'devuelto'
  prestamo.fecha_devolucion = new Date().toISOString().split('T')[0]
  const libro = libros.find(l => l.id === prestamo.libro_id)
  if (libro) libro.copias_disponibles += 1
  return { ok: true, mensaje: 'Devolucion registrada.' }
}

// ─── RESERVAS ────────────────────────────────────────────────

/**
 * Reservas activas de un socio.
 */
export function getReservasByMiembro(miembro_id) {
  return reservas.filter(
    r => r.miembro_id === Number(miembro_id) && r.estado === 'reservado'
  )
}

/**
 * Reservas activas de un libro puntual, ordenadas por posicion en la cola.
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
 * Crea una reserva para un socio sobre un libro sin copias disponibles.
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

  // Estimacion: 14 dias por cada persona en la cola antes que el.
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
  return { ok: true, mensaje: `Reserva creada. Estas en posicion ${posicion} en la cola.`, reserva: nuevaReserva }
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
 * Multas pendientes de un socio.
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
    .map(omitPassword)
}

export function getMiembroById(id) {
  const u = usuarios.find(u => u.id === Number(id))
  if (!u) return null
  return omitPassword(u)
}

// ─── UTILIDADES ──────────────────────────────────────────────

/**
 * Determina el estado visual de un prestamo segun su fecha de vencimiento.
 * Es logica pura, por eso se reexporta desde apiService.js sin cambios.
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
