import { Router } from 'express'
import Miembro from '../models/Miembro.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/miembros — lista todos los miembros (bibliotecario)
router.get('/', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const miembros = await Miembro.find({ rol: 'miembro' }).sort({ nombre: 1 })
    // El modelo ya excluye el password en toJSON
    return res.json(miembros.map(m => ({
      id:             m.id,
      cedula:         m.cedula,
      nombre:         m.nombre,
      email:          m.email,
      telefono:       m.telefono,
      tipo_membresia: m.tipo_membresia,
      estado:         m.estado,
      fecha_registro: m.fecha_registro ? new Date(m.fecha_registro).toISOString().split('T')[0] : null,
    })))
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo miembros.' })
  }
})

export default router
