import { Router } from 'express'
import jwt from 'jsonwebtoken'
import Miembro from '../models/Miembro.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { cedula, password } = req.body

    if (!cedula || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Cédula y contraseña son requeridas.' })
    }

    const miembro = await Miembro.findOne({ cedula: cedula.trim() })
    if (!miembro) {
      return res.status(401).json({ ok: false, mensaje: 'Cédula o contraseña incorrecta.' })
    }

    const passwordValida = await miembro.verificarPassword(password)
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: 'Cédula o contraseña incorrecta.' })
    }

    if (miembro.estado !== 'activo') {
      return res.status(403).json({ ok: false, mensaje: 'Tu cuenta está suspendida. Contacta a la biblioteca.' })
    }

    // Generar JWT con datos que el frontend necesita (sin password)
    const payload = {
      id:              miembro.id,
      cedula:          miembro.cedula,
      nombre:          miembro.nombre,
      email:           miembro.email,
      direccion:       miembro.direccion,
      telefono:        miembro.telefono,
      tipo_membresia:  miembro.tipo_membresia,
      estado:          miembro.estado,
      rol:             miembro.rol,
      fecha_registro:  miembro.fecha_registro,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

    return res.json({ ok: true, token, user: payload })
  } catch (err) {
    console.error('Error en login:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
  }
})

export default router
