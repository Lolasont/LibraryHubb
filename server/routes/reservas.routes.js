// Router de reservas.
// Permite a los socios anotarse en la cola de espera de un libro
// que no tiene copias disponibles, y cancelar reservas propias.

// ──────────────────────────────────────────────────────────────────
// AMPLIACION DEL ALCANCE ORIGINAL
// El enunciado del caso pedia unicamente el frontend de una biblioteca
// digital municipal (5 vistas: Login, Buscar Libros, Detalle de Libro,
// Mi Perfil y Mis Reservas), usando una API publica de conversion de
// moneda para las multas. Este backend completo no formaba parte de
// ese enunciado. Se conserva porque esta completamente integrado al
// sistema y el equipo decidio mantenerlo como valor anadido del
// proyecto, no porque haya sido requerido originalmente.
// ──────────────────────────────────────────────────────────────────

import { Router } from 'express'
import Reserva from '../models/Reserva.js'
import Libro from '../models/Libro.js'
import { verifyToken, requireRole } from '../middleware/auth.js'
import { toDate } from '../utils/format.js'

const router = Router()

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

// GET /api/reservas/me
// Devuelve las reservas activas del socio logueado.
router.get('/me', verifyToken, async (req, res) => {
  try {
    const reservas = await Reserva.find({
      miembro: req.user.id,
      estado:  'reservado',
    }).populate('libro', 'titulo').sort({ posicion_cola: 1 })

    return res.json(reservas.map(formatReserva))
  } catch (err) {
    console.error('Error obteniendo reservas del miembro:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo reservas.' })
  }
})

// GET /api/reservas/libro/:libro_id
// Devuelve la cola completa de reservas de un libro puntual.
router.get('/libro/:libro_id', verifyToken, async (req, res) => {
  try {
    const reservas = await Reserva.find({
      libro:  req.params.libro_id,
      estado: 'reservado',
    }).sort({ posicion_cola: 1 })

    return res.json(reservas.map(formatReserva))
  } catch (err) {
    console.error('Error obteniendo cola de reservas del libro:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo cola de reservas.' })
  }
})

// GET /api/reservas
// Lista todas las reservas activas del sistema. Solo para bibliotecarios.
router.get('/', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const reservas = await Reserva.find({ estado: 'reservado' })
      .populate('libro',   'titulo')
      .populate('miembro', 'nombre cedula')
      .sort({ libro: 1, posicion_cola: 1 })

    return res.json(reservas.map(formatReserva))
  } catch (err) {
    console.error('Error obteniendo todas las reservas:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo reservas.' })
  }
})

// POST /api/reservas
// Un socio crea una reserva sobre un libro sin copias disponibles.
router.post('/', verifyToken, async (req, res) => {
  try {
    const { libro_id } = req.body
    if (!libro_id) {
      return res.status(400).json({ ok: false, mensaje: 'libro_id es requerido.' })
    }

    // Validamos que el socio no tenga ya una reserva activa para este mismo libro.
    const yaReservado = await Reserva.findOne({
      miembro: req.user.id,
      libro:   libro_id,
      estado:  'reservado',
    })
    if (yaReservado) {
      return res.status(400).json({ ok: false, mensaje: 'Ya tienes una reserva activa para este libro.' })
    }

    const libro = await Libro.findById(libro_id)
    if (!libro) {
      return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado.' })
    }

    // Calculamos la posicion: cuantas reservas hay antes + 1.
    const colaActual = await Reserva.countDocuments({ libro: libro_id, estado: 'reservado' })
    const posicion   = colaActual + 1

    // Fecha estimada: 14 dias por cada persona en la cola (estimacion).
    const fechaEstimada = new Date()
    fechaEstimada.setDate(fechaEstimada.getDate() + posicion * 14)

    const reserva = await Reserva.create({
      miembro:                       req.user.id,
      libro:                         libro_id,
      fecha_reserva:                 new Date(),
      posicion_cola:                 posicion,
      estado:                        'reservado',
      fecha_estimada_disponibilidad: fechaEstimada,
    })

    await reserva.populate('libro', 'titulo')

    return res.status(201).json({
      ok:      true,
      mensaje: `Reserva creada. Estas en posicion ${posicion} en la cola.`,
      reserva: formatReserva(reserva),
    })
  } catch (err) {
    console.error('Error creando reserva:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al crear la reserva.' })
  }
})

// DELETE /api/reservas/:id
// Cancela una reserva activa. La puede cancelar su dueno o un bibliotecario.
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id)
    if (!reserva) {
      return res.status(404).json({ ok: false, mensaje: 'Reserva no encontrada.' })
    }

    const esDueno = reserva.miembro.toString() === req.user.id
    if (!esDueno && req.user.rol !== 'bibliotecario') {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para cancelar esta reserva.' })
    }

    // En vez de borrar fisicamente, marcamos la reserva como cancelada.
    // Asi conservamos el historial y evitamos romper referencias.
    reserva.estado = 'cancelado'
    await reserva.save()

    return res.json({ ok: true, mensaje: 'Reserva cancelada.' })
  } catch (err) {
    console.error('Error cancelando reserva:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al cancelar la reserva.' })
  }
})

export default router
