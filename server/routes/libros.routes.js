import { Router } from 'express'
import Libro from '../models/Libro.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// Formatea un documento Libro al shape que espera el frontend
function formatLibro(libro) {
  return {
    id:                  libro.id,
    titulo:              libro.titulo,
    isbn:                libro.isbn ?? null,
    autores:             libro.autores ?? [],
    editorial:           libro.editorial ?? null,
    categoria:           libro.categoria?.nombre ?? null,
    categoria_id:        libro.categoria?.id ?? null,
    año_publicacion:     libro.año_publicacion ?? null,
    paginas:             libro.paginas ?? null,
    cantidad_copias:     libro.cantidad_copias,
    copias_disponibles:  libro.copias_disponibles,
  }
}

// GET /api/libros?busqueda=&categoria_id=
router.get('/', verifyToken, async (req, res) => {
  try {
    const { busqueda = '', categoria_id } = req.query
    const filtro = {}

    if (busqueda.trim()) {
      filtro.$or = [
        { titulo:  { $regex: busqueda.trim(), $options: 'i' } },
        { autores: { $regex: busqueda.trim(), $options: 'i' } },
        { isbn:    { $regex: busqueda.trim(), $options: 'i' } },
      ]
    }

    if (categoria_id) {
      filtro.categoria = categoria_id
    }

    const libros = await Libro.find(filtro)
      .populate('categoria', 'nombre')
      .sort({ titulo: 1 })

    return res.json(libros.map(formatLibro))
  } catch (err) {
    console.error('Error listando libros:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo libros.' })
  }
})

// GET /api/libros/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id).populate('categoria', 'nombre')
    if (!libro) {
      return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado.' })
    }
    return res.json(formatLibro(libro))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo el libro.' })
  }
})

export default router
