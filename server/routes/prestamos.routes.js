import { Router } from 'express'
import Prestamo from '../models/Prestamo.js'
import Libro from '../models/Libro.js'
import Multa from '../models/Multa.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

// Formatea un Prestamo al shape que espera el frontend
function formatPrestamo(p) {
  const toDate = d => d ? new Date(d).toISOString().split('T')[0] : null
  return {
    id:                        p.id,
    miembro_id:                p.miembro?._id?.toString() ?? p.miembro?.toString(),
    libro_id:                  p.libro?._id?.toString()   ?? p.libro?.toString(),
    libro_titulo:              p.libro?.titulo ?? null,
    fecha_prestamo:            toDate(p.fecha_prestamo),
    fecha_devolucion_esperada: toDate(p.fecha_devolucion_esperada),
    fecha_devolucion:          toDate(p.fecha_devolucion),
    estado:                    p.estado,
  }
}

// GET /api/prestamos/me — préstamos activos/vencidos del miembro autenticado
router.get('/me', verifyToken, async (req, res) => {
  try {
    const prestamos = await Prestamo.find({
      miembro: req.user.id,
      estado:  { $ne: 'devuelto' },
    }).populate('libro', 'titulo')

    return res.json(prestamos.map(formatPrestamo))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo préstamos.' })
  }
})

// GET /api/prestamos — todos los préstamos activos/vencidos (bibliotecario)
router.get('/', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const prestamos = await Prestamo.find({ estado: { $ne: 'devuelto' } })
      .populate('libro', 'titulo')
      .populate('miembro', 'nombre cedula')
      .sort({ fecha_devolucion_esperada: 1 })

    return res.json(prestamos.map(formatPrestamo))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo préstamos.' })
  }
})

// POST /api/prestamos — solicitar préstamo
router.post('/', verifyToken, async (req, res) => {
  try {
    const { libro_id } = req.body
    if (!libro_id) {
      return res.status(400).json({ ok: false, mensaje: 'libro_id es requerido.' })
    }

    const libro = await Libro.findById(libro_id)
    if (!libro) {
      return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado.' })
    }
    if (libro.copias_disponibles < 1) {
      return res.status(400).json({ ok: false, mensaje: 'No hay copias disponibles.' })
    }

    const fechaVenc = new Date()
    fechaVenc.setDate(fechaVenc.getDate() + 14)

    const prestamo = await Prestamo.create({
      miembro:                   req.user.id,
      libro:                     libro_id,
      fecha_prestamo:            new Date(),
      fecha_devolucion_esperada: fechaVenc,
      estado:                    'activo',
    })

    // Decrementar copia disponible
    await Libro.findByIdAndUpdate(libro_id, { $inc: { copias_disponibles: -1 } })

    // Populate para devolver el formato correcto
    await prestamo.populate('libro', 'titulo')

    return res.status(201).json({
      ok:      true,
      mensaje: 'Préstamo registrado con éxito.',
      prestamo: formatPrestamo(prestamo),
    })
  } catch (err) {
    console.error('Error creando préstamo:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al solicitar el préstamo.' })
  }
})

// PATCH /api/prestamos/:id/renovar — renovar 14 días más
router.patch('/:id/renovar', verifyToken, async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id)
    if (!prestamo) {
      return res.status(404).json({ ok: false, mensaje: 'Préstamo no encontrado.' })
    }

    // Verificar que el préstamo pertenece al usuario (o es bibliotecario)
    const esDueno = prestamo.miembro.toString() === req.user.id
    if (!esDueno && req.user.rol !== 'bibliotecario') {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para renovar este préstamo.' })
    }

    if (prestamo.estado === 'devuelto') {
      return res.status(400).json({ ok: false, mensaje: 'No se puede renovar un préstamo ya devuelto.' })
    }

    const base = new Date(prestamo.fecha_devolucion_esperada)
    base.setDate(base.getDate() + 14)
    prestamo.fecha_devolucion_esperada = base
    prestamo.estado = 'activo'
    await prestamo.save()

    return res.json({ ok: true, mensaje: 'Préstamo renovado por 14 días más.' })
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error al renovar el préstamo.' })
  }
})

// PATCH /api/prestamos/:id/devolver — registrar devolución (bibliotecario)
router.patch('/:id/devolver', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id)
    if (!prestamo) {
      return res.status(404).json({ ok: false, mensaje: 'Préstamo no encontrado.' })
    }

    prestamo.estado           = 'devuelto'
    prestamo.fecha_devolucion = new Date()
    await prestamo.save()

    // Liberar la copia del libro
    await Libro.findByIdAndUpdate(prestamo.libro, { $inc: { copias_disponibles: 1 } })

    // Generar multa automática si estaba vencido
    const hoy  = new Date()
    const venc = new Date(prestamo.fecha_devolucion_esperada)
    if (hoy > venc) {
      const diasAtraso = Math.ceil((hoy - venc) / (1000 * 60 * 60 * 24))
      const monto      = diasAtraso * 1000  // $1.000 CLP por día de atraso
      await Multa.create({
        prestamo: prestamo._id,
        miembro:  prestamo.miembro,
        monto,
        pagada:   false,
      })
    }

    return res.json({ ok: true, mensaje: 'Devolución registrada correctamente.' })
  } catch (err) {
    console.error('Error registrando devolución:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar la devolución.' })
  }
})

export default router
