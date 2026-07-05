// Router de libros.
// Lista libros con busqueda y filtro por categoria, y devuelve el detalle.

import { Router } from 'express'
import Libro from '../models/Libro.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// Cuando el usuario busca por texto, ese texto se usa dentro de un $regex de Mongo.
// Si no escapamos los caracteres especiales, un usuario podria provocar
// una inyeccion de regex o ataques de tipo ReDoS (Regular Expression Denial of Service).
// Esta funcion los neutraliza agregando un backslash antes de cada uno.
function escapeRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Convierte un documento Libro de Mongo al formato que espera el frontend.
// Hace un flatten de la categoria: en vez de devolver un objeto {id, nombre},
// devuelve dos campos separados (categoria_id y categoria con el nombre).
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
// busqueda: filtra por titulo, autor o ISBN (case-insensitive).
// categoria_id: filtra por una categoria puntual.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { busqueda = '', categoria_id } = req.query
    const filtro = {}

    if (busqueda.trim()) {
      const termino = escapeRegex(busqueda.trim())
      filtro.$or = [
        { titulo:  { $regex: termino, $options: 'i' } },
        { autores: { $regex: termino, $options: 'i' } },
        { isbn:    { $regex: termino, $options: 'i' } },
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
// Devuelve el detalle de un libro puntual.
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id).populate('categoria', 'nombre')
    if (!libro) {
      return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado.' })
    }
    return res.json(formatLibro(libro))
  } catch (err) {
    console.error('Error obteniendo libro por id:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo el libro.' })
  }
})

export default router
