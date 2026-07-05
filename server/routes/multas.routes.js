// Router de multas.
// Los socios consultan sus multas pendientes. El bibliotecario ve todas.

import { Router } from 'express'
import Multa from '../models/Multa.js'
import { verifyToken, requireRole } from '../middleware/auth.js'
import { toDate } from '../utils/format.js'

const router = Router()

function formatMulta(m) {
  return {
    id:          m.id,
    prestamo_id: m.prestamo?._id?.toString() ?? m.prestamo?.toString(),
    miembro_id:  m.miembro?._id?.toString()  ?? m.miembro?.toString(),
    monto:       m.monto,
    pagada:      m.pagada,
    fecha_pago:  toDate(m.fecha_pago),
  }
}

// GET /api/multas/me
// Devuelve las multas pendientes (no pagadas) del socio logueado.
router.get('/me', verifyToken, async (req, res) => {
  try {
    const multas = await Multa.find({ miembro: req.user.id, pagada: false })
    return res.json(multas.map(formatMulta))
  } catch (err) {
    console.error('Error obteniendo multas del miembro:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo multas.' })
  }
})

// GET /api/multas
// Devuelve todas las multas pendientes del sistema. Solo para bibliotecarios.
router.get('/', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const multas = await Multa.find({ pagada: false })
      .populate('miembro',  'nombre cedula')
      .populate('prestamo', 'fecha_devolucion_esperada')
      .sort({ createdAt: -1 })

    return res.json(multas.map(formatMulta))
  } catch (err) {
    console.error('Error obteniendo todas las multas:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo multas.' })
  }
})

export default router
