// Servicio de prestamos.
// Endpoints para que los socios pidan, renueven y devuelvan libros.
// El bibliotecario registra devoluciones y multas automaticas.

import Prestamo from '../models/Prestamo.js'
import Libro from '../models/Libro.js'
import Multa from '../models/Multa.js'
import { requerirSesion, requerirRol } from './sesion.service.js'
import { toDate } from '../utils/format.js'

const MAX_RENOVACIONES = 2

// Da formato a un prestamo para enviar al frontend.
// Los ObjectId de Mongoose se transforman en strings para que sean
// faciles de usar en el cliente.
function formatPrestamo(p) {
  return {
    id:                        p.id,
    miembro_id:                p.miembro?._id?.toString() ?? p.miembro?.toString(),
    miembro_nombre:            p.miembro?.nombre ?? null,
    libro_id:                  p.libro?._id?.toString()   ?? p.libro?.toString(),
    libro_titulo:              p.libro?.titulo ?? null,
    fecha_prestamo:            toDate(p.fecha_prestamo),
    fecha_devolucion_esperada: toDate(p.fecha_devolucion_esperada),
    fecha_devolucion:          toDate(p.fecha_devolucion),
    estado:                    p.estado,
  }
}

/**
 * Devuelve los prestamos activos o vencidos del socio logueado.
 * @returns {Promise<Array<object>>}
 */
export async function getPrestamosActivos() {
  const usuarioActual = requerirSesion()
  const prestamos = await Prestamo.find({
    miembro: usuarioActual.id,
    estado:  { $ne: 'devuelto' },
  }).populate('libro', 'titulo')

  return prestamos.map(formatPrestamo)
}

/**
 * Devuelve todos los prestamos activos o vencidos. Solo para bibliotecarios.
 * @returns {Promise<Array<object>>}
 */
export async function getTodosPrestamos() {
  requerirRol('bibliotecario')
  const prestamos = await Prestamo.find({ estado: { $ne: 'devuelto' } })
    .populate('libro', 'titulo')
    .populate('miembro', 'nombre cedula')
    .sort({ fecha_devolucion_esperada: 1 })

  return prestamos.map(formatPrestamo)
}

/**
 * Un socio pide un prestamo.
 * @param {string} libroId
 * @returns {Promise<{ ok: boolean, mensaje: string, prestamo?: object }>}
 */
export async function solicitarPrestamo(libroId) {
  const usuarioActual = requerirSesion()
  if (!libroId) {
    return { ok: false, mensaje: 'libro_id es requerido.' }
  }

  const libro = await Libro.findById(libroId)
  if (!libro) {
    return { ok: false, mensaje: 'Libro no encontrado.' }
  }
  if (libro.copias_disponibles < 1) {
    return { ok: false, mensaje: 'No hay copias disponibles.' }
  }

  // Calculamos la fecha de devolucion: hoy + 14 dias.
  const fechaVenc = new Date()
  fechaVenc.setDate(fechaVenc.getDate() + 14)

  const prestamo = await Prestamo.create({
    miembro:                   usuarioActual.id,
    libro:                     libroId,
    fecha_prestamo:            new Date(),
    fecha_devolucion_esperada: fechaVenc,
    estado:                    'activo',
  })

  // Le descontamos una copia disponible al libro.
  await Libro.findByIdAndUpdate(libroId, { $inc: { copias_disponibles: -1 } })

  // Cargamos el titulo del libro para devolverlo en la respuesta.
  await prestamo.populate('libro', 'titulo')

  return {
    ok:      true,
    mensaje: 'Prestamo registrado con exito.',
    prestamo: formatPrestamo(prestamo),
  }
}

/**
 * Renueva un prestamo 14 dias, si no se supero el limite.
 * @param {string} prestamoId
 * @returns {Promise<{ ok: boolean, mensaje: string }>}
 */
export async function renovarPrestamo(prestamoId) {
  const usuarioActual = requerirSesion()
  const prestamo = await Prestamo.findById(prestamoId)
  if (!prestamo) {
    return { ok: false, mensaje: 'Prestamo no encontrado.' }
  }

  // Verificamos que el prestamo le pertenezca al usuario logueado.
  const esDueno = prestamo.miembro.toString() === usuarioActual.id
  if (!esDueno && usuarioActual.rol !== 'bibliotecario') {
    return { ok: false, mensaje: 'No tienes permiso para renovar este prestamo.' }
  }

  if (prestamo.estado === 'devuelto') {
    return { ok: false, mensaje: 'No se puede renovar un prestamo ya devuelto.' }
  }

  if ((prestamo.renovaciones ?? 0) >= MAX_RENOVACIONES) {
    return {
      ok: false,
      mensaje: `No puedes tener mas de ${MAX_RENOVACIONES} renovaciones de este libro. Debes devolverlo.`,
    }
  }

  // Sumamos 14 dias a la fecha actual de devolucion esperada.
  const base = new Date(prestamo.fecha_devolucion_esperada)
  base.setDate(base.getDate() + 14)
  prestamo.fecha_devolucion_esperada = base
  prestamo.estado = 'activo'
  prestamo.renovaciones = (prestamo.renovaciones ?? 0) + 1
  await prestamo.save()

  return {
    ok: true,
    mensaje: `Prestamo renovado por 14 dias mas (${prestamo.renovaciones}/${MAX_RENOVACIONES}).`,
  }
}

/**
 * Registra la devolucion de un libro. Solo el bibliotecario puede hacerlo.
 * Si la devolucion es tardia, se genera una multa automaticamente.
 * @param {string} prestamoId
 * @returns {Promise<{ ok: boolean, mensaje: string }>}
 */
export async function registrarDevolucion(prestamoId) {
  requerirRol('bibliotecario')
  const prestamo = await Prestamo.findById(prestamoId)
  if (!prestamo) {
    return { ok: false, mensaje: 'Prestamo no encontrado.' }
  }

  prestamo.estado           = 'devuelto'
  prestamo.fecha_devolucion = new Date()
  await prestamo.save()

  // Liberamos una copia del libro.
  await Libro.findByIdAndUpdate(prestamo.libro, { $inc: { copias_disponibles: 1 } })

  // Si la fecha de devolucion es posterior a la fecha esperada,
  // generamos una multa de $1.000 CLP por cada dia de atraso.
  const hoy  = new Date()
  const venc = new Date(prestamo.fecha_devolucion_esperada)
  if (hoy > venc) {
    const diasAtraso = Math.ceil((hoy - venc) / (1000 * 60 * 60 * 24))
    const monto      = diasAtraso * 1000
    await Multa.create({
      prestamo: prestamo._id,
      miembro:  prestamo.miembro,
      monto,
      pagada:   false,
    })
  }

  return { ok: true, mensaje: 'Devolucion registrada correctamente.' }
}
