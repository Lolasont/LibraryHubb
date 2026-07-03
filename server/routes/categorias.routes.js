import { Router } from 'express'
import Categoria from '../models/Categoria.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// GET /api/categorias
router.get('/', verifyToken, async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nombre: 1 })
    return res.json(categorias.map(c => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion })))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo categorías.' })
  }
})

export default router
