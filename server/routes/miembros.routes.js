// Router de miembros.
// El bibliotecario consulta el listado completo de socios del sistema.

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
import Miembro from '../models/Miembro.js'
import { verifyToken, requireRole } from '../middleware/auth.js'
import { toDate } from '../utils/format.js'

const router = Router()

// GET /api/miembros
// Devuelve la lista de socios. Excluye al bibliotecario (solo trae rol "miembro").
// Solo accesible para el bibliotecario.
router.get('/', verifyToken, requireRole('bibliotecario'), async (req, res) => {
  try {
    const miembros = await Miembro.find({ rol: 'miembro' }).sort({ nombre: 1 })
    // El modelo ya se encarga de eliminar el password en su transformacion a JSON.
    return res.json(miembros.map(m => ({
      id:             m.id,
      cedula:         m.cedula,
      nombre:         m.nombre,
      email:          m.email,
      telefono:       m.telefono,
      tipo_membresia: m.tipo_membresia,
      estado:         m.estado,
      fecha_registro: toDate(m.fecha_registro),
    })))
  } catch (err) {
    console.error('Error obteniendo miembros:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo miembros.' })
  }
})

export default router
