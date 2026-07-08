// Router de categorias.
// Lista todas las categorias de libros que existen en el sistema.

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
import Categoria from '../models/Categoria.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// GET /api/categorias
// Devuelve las categorias ordenadas alfabeticamente.
router.get('/', verifyToken, async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nombre: 1 })
    return res.json(categorias.map(c => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion })))
  } catch (err) {
    console.error('Error obteniendo categorias:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo categorias.' })
  }
})

export default router
