import { Router } from 'express'
import Reserva from '../models/Reserva.js'
import Libro from '../models/Libro.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

function formatReserva(r) {
  const toDate = d => d ? new Date(d).toISOString().split('T')[0] : null
  return {
    id:                            r.id,
    miembro_id:                    r.miembro?._id?.toString() ?? r.miembro?.toString(),
    libro_id:                      r.libro?._id?.toString()   ?? r.libro?.toString(),
    libro_titulo:                  r.libro?.titulo ?? null,
    fecha_reserva:                 toDate(r.fecha_reserva),
    posicion_cola:                 r.posicion_cola,
    estado:                        r.estado,
    fecha_estimada_disponibilidad: toDate(r.fecha_estimada_disponibilidad),
  }
}

// GET /api/reservas/me — reservas activas del miembro
router.get('/me', verifyToken, async (req, res) => {
  try {
    const reservas = await Reserva.find({
      miembro: req.user.id,
      estado:  'reservado',
    }).populate('libro', 'titulo').sort({ posicion_cola: 1 })

    return res.json(reservas.map(formatReserva))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo reservas.' })
  }
})

// GET /api/reservas/libro/:libro_id — cola de reservas de un libro
router.get('/libro/:libro_id', verifyToken, async (req, res) => {
  try {
    const reservas = await Reserva.find({
      libro:  req.params.libro_id,
      estado: 'reservado',
    }).sort({ posicion_cola: 1 })

    return res.json(reservas.map(formatReserva))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo cola de reservas.' })
  }
})

// GET /api/reservas — todas las reservas activas (bibliotecario)
router.get('/', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const reservas = await Reserva.find({ estado: 'reservado' })
      .populate('libro',   'titulo')
      .populate('miembro', 'nombre cedula')
      .sort({ libro: 1, posicion_cola: 1 })

    return res.json(reservas.map(formatReserva))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo reservas.' })
  }
})

// POST /api/reservas — crear reserva
router.post('/', verifyToken, async (req, res) => {
  try {
    const { libro_id } = req.body
    if (!libro_id) {
      return res.status(400).json({ ok: false, mensaje: 'libro_id es requerido.' })
    }

    // Verificar que no tenga reserva ya activa para este libro
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

    // Calcular posición en la cola
    const colaActual = await Reserva.countDocuments({ libro: libro_id, estado: 'reservado' })
    const posicion   = colaActual + 1

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
      mensaje: `Reserva creada. Estás en posición ${posicion} en la cola.`,
      reserva: formatReserva(reserva),
    })
  } catch (err) {
    console.error('Error creando reserva:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al crear la reserva.' })
  }
})

// DELETE /api/reservas/:id — cancelar reserva
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

    reserva.estado = 'cancelado'
    await reserva.save()

    return res.json({ ok: true, mensaje: 'Reserva cancelada.' })
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error al cancelar la reserva.' })
  }
})

export default router
