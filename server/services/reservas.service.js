// Servicio de reservas.
// Permite a los socios anotarse en la cola de espera de un libro
// que no tiene copias disponibles, y cancelar reservas propias.

import Reserva from '../models/Reserva.js'
import Libro from '../models/Libro.js'
import { requerirSesion, requerirRol } from './sesion.service.js'
import { toDate } from '../utils/format.js'

// Da formato a una reserva para enviar al frontend.
function formatReserva(r) {
  return {
    id:                            r.id,
    miembro_id:                    r.miembro?._id?.toString() ?? r.miembro?.toString(),
    miembro_nombre:                r.miembro?.nombre ?? null,
    libro_id:                      r.libro?._id?.toString()   ?? r.libro?.toString(),
    libro_titulo:                  r.libro?.titulo ?? null,
    fecha_reserva:                 toDate(r.fecha_reserva),
    posicion_cola:                 r.posicion_cola,
    estado:                        r.estado,
    fecha_estimada_disponibilidad: toDate(r.fecha_estimada_disponibilidad),
  }
}

/**
 * Devuelve las reservas activas del socio logueado.
 * @returns {Promise<Array<object>>}
 */
export async function getReservasByMiembro() {
  const usuarioActual = requerirSesion()
  const reservas = await Reserva.find({
    miembro: usuarioActual.id,
    estado:  'reservado',
  }).populate('libro', 'titulo').sort({ posicion_cola: 1 })

  return reservas.map(formatReserva)
}

/**
 * Devuelve la cola completa de reservas de un libro puntual.
 * @param {string} libroId
 * @returns {Promise<Array<object>>}
 */
export async function getReservasByLibro(libroId) {
  requerirSesion()
  const reservas = await Reserva.find({
    libro:  libroId,
    estado: 'reservado',
  }).sort({ posicion_cola: 1 })

  return reservas.map(formatReserva)
}

/**
 * Lista todas las reservas activas del sistema. Solo para bibliotecarios.
 * @returns {Promise<Array<object>>}
 */
export async function getTodasReservas() {
  requerirRol('bibliotecario')
  const reservas = await Reserva.find({ estado: 'reservado' })
    .populate('libro',   'titulo')
    .populate('miembro', 'nombre cedula')
    .sort({ libro: 1, posicion_cola: 1 })

  return reservas.map(formatReserva)
}

/**
 * Un socio crea una reserva sobre un libro sin copias disponibles.
 * @param {string} libroId
 * @returns {Promise<{ ok: boolean, mensaje: string, reserva?: object }>}
 */
export async function hacerReserva(libroId) {
  const usuarioActual = requerirSesion()
  if (!libroId) {
    return { ok: false, mensaje: 'libro_id es requerido.' }
  }

  // Validamos que el socio no tenga ya una reserva activa para este mismo libro.
  const yaReservado = await Reserva.findOne({
    miembro: usuarioActual.id,
    libro:   libroId,
    estado:  'reservado',
  })
  if (yaReservado) {
    return { ok: false, mensaje: 'Ya tienes una reserva activa para este libro.' }
  }

  const libro = await Libro.findById(libroId)
  if (!libro) {
    return { ok: false, mensaje: 'Libro no encontrado.' }
  }

  // Calculamos la posicion: cuantas reservas hay antes + 1.
  const colaActual = await Reserva.countDocuments({ libro: libroId, estado: 'reservado' })
  const posicion   = colaActual + 1

  // Fecha estimada: 14 dias por cada persona en la cola (estimacion).
  const fechaEstimada = new Date()
  fechaEstimada.setDate(fechaEstimada.getDate() + posicion * 14)

  const reserva = await Reserva.create({
    miembro:                       usuarioActual.id,
    libro:                         libroId,
    fecha_reserva:                 new Date(),
    posicion_cola:                 posicion,
    estado:                        'reservado',
    fecha_estimada_disponibilidad: fechaEstimada,
  })

  await reserva.populate('libro', 'titulo')

  return {
    ok:      true,
    mensaje: `Reserva creada. Estas en posicion ${posicion} en la cola.`,
    reserva: formatReserva(reserva),
  }
}

/**
 * Cancela una reserva activa. La puede cancelar su dueno o un bibliotecario.
 * @param {string} reservaId
 * @returns {Promise<{ ok: boolean, mensaje: string }>}
 */
export async function cancelarReserva(reservaId) {
  const usuarioActual = requerirSesion()
  const reserva = await Reserva.findById(reservaId)
  if (!reserva) {
    return { ok: false, mensaje: 'Reserva no encontrada.' }
  }

  const esDueno = reserva.miembro.toString() === usuarioActual.id
  if (!esDueno && usuarioActual.rol !== 'bibliotecario') {
    return { ok: false, mensaje: 'No tienes permiso para cancelar esta reserva.' }
  }

  // En vez de borrar fisicamente, marcamos la reserva como cancelada.
  // Asi conservamos el historial y evitamos romper referencias.
  reserva.estado = 'cancelado'
  await reserva.save()

  return { ok: true, mensaje: 'Reserva cancelada.' }
}
