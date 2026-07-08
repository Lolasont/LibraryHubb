// Router de prestamos.
// Endpoints para que los socios pidan, renueven y devuelvan libros.
// El bibliotecario registra devoluciones y multas automaticas.


import { Router } from 'express'
import Prestamo from '../models/Prestamo.js'
import Libro from '../models/Libro.js'
import Multa from '../models/Multa.js'
import { verifyToken, requireRole } from '../middleware/auth.js'
import { toDate } from '../utils/format.js'

const router = Router()

// Limite de veces que se puede renovar un mismo prestamo. Al llegar a este
// numero, el boton "Renovar" del frontend se desactiva y el backend rechaza
// la peticion aunque igual llegue (defensa en profundidad).
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
    renovaciones:              p.renovaciones ?? 0,
    max_renovaciones:          MAX_RENOVACIONES,
  }
}

// GET /api/prestamos/me
// Devuelve los prestamos activos o vencidos del socio logueado.
router.get('/me', verifyToken, async (req, res) => {
  try {
    const prestamos = await Prestamo.find({
      miembro: req.user.id,
      estado:  { $ne: 'devuelto' },
    }).populate('libro', 'titulo')

    return res.json(prestamos.map(formatPrestamo))
  } catch (err) {
    console.error('Error obteniendo prestamos del miembro:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo prestamos.' })
  }
})

// GET /api/prestamos
// Devuelve todos los prestamos activos o vencidos. Solo para bibliotecarios.
router.get('/', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const prestamos = await Prestamo.find({ estado: { $ne: 'devuelto' } })
      .populate('libro', 'titulo')
      .populate('miembro', 'nombre cedula')
      .sort({ fecha_devolucion_esperada: 1 })

    return res.json(prestamos.map(formatPrestamo))
  } catch (err) {
    console.error('Error obteniendo todos los prestamos:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo prestamos.' })
  }
})

// POST /api/prestamos
// Un socio pide un prestamo. Body: { libro_id }
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

    // Calculamos la fecha de devolucion: hoy + 14 dias.
    const fechaVenc = new Date()
    fechaVenc.setDate(fechaVenc.getDate() + 14)

    const prestamo = await Prestamo.create({
      miembro:                   req.user.id,
      libro:                     libro_id,
      fecha_prestamo:            new Date(),
      fecha_devolucion_esperada: fechaVenc,
      estado:                    'activo',
      renovaciones:              0,
    })

    // Le descontamos una copia disponible al libro.
    await Libro.findByIdAndUpdate(libro_id, { $inc: { copias_disponibles: -1 } })

    // Cargamos el titulo del libro para devolverlo en la respuesta.
    await prestamo.populate('libro', 'titulo')

    return res.status(201).json({
      ok:      true,
      mensaje: 'Prestamo registrado con exito.',
      prestamo: formatPrestamo(prestamo),
    })
  } catch (err) {
    console.error('Error creando prestamo:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al solicitar el prestamo.' })
  }
})

// PATCH /api/prestamos/:id/renovar
// Renueva un prestamo por 14 dias mas. El socio dueno del prestamo
// o un bibliotecario pueden hacerlo. Maximo MAX_RENOVACIONES veces
// por prestamo; despues de eso hay que devolver el libro.
router.patch('/:id/renovar', verifyToken, async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id)
    if (!prestamo) {
      return res.status(404).json({ ok: false, mensaje: 'Prestamo no encontrado.' })
    }

    // Verificamos que el prestamo le pertenezca al usuario logueado.
    const esDueno = prestamo.miembro.toString() === req.user.id
    if (!esDueno && req.user.rol !== 'bibliotecario') {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para renovar este prestamo.' })
    }

    if (prestamo.estado === 'devuelto') {
      return res.status(400).json({ ok: false, mensaje: 'No se puede renovar un prestamo ya devuelto.' })
    }

    if ((prestamo.renovaciones ?? 0) >= MAX_RENOVACIONES) {
      return res.status(400).json({
        ok:      false,
        mensaje: `No puedes tener mas de ${MAX_RENOVACIONES} renovaciones de este libro. Debes devolverlo.`,
      })
    }

    // Sumamos 14 dias a la fecha actual de devolucion esperada.
    const base = new Date(prestamo.fecha_devolucion_esperada)
    base.setDate(base.getDate() + 14)
    prestamo.fecha_devolucion_esperada = base
    prestamo.estado       = 'activo'
    prestamo.renovaciones = (prestamo.renovaciones ?? 0) + 1
    await prestamo.save()

    return res.json({
      ok:      true,
      mensaje: `Prestamo renovado por 14 dias mas (${prestamo.renovaciones}/${MAX_RENOVACIONES}).`,
    })
  } catch (err) {
    console.error('Error renovando prestamo:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al renovar el prestamo.' })
  }
})

// PATCH /api/prestamos/:id/devolver
// Registra la devolucion de un libro. Solo el bibliotecario puede hacerlo.
// Si la devolucion es tardia, se genera una multa automaticamente.
router.patch('/:id/devolver', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id)
    if (!prestamo) {
      return res.status(404).json({ ok: false, mensaje: 'Prestamo no encontrado.' })
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

    return res.json({ ok: true, mensaje: 'Devolucion registrada correctamente.' })
  } catch (err) {
    console.error('Error registrando devolucion:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar la devolucion.' })
  }
})

export default router
