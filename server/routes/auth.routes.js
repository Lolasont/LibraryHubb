// Router de autenticacion.
// Hoy solo expone el endpoint de login.
// Devuelve un JWT + los datos del usuario (sin contrasena) que el frontend guarda.

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import Miembro from '../models/Miembro.js'

const router = Router()

// POST /api/auth/login
// Body esperado: { cedula, password }
router.post('/login', async (req, res) => {
  try {
    const { cedula, password } = req.body

    if (!cedula || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Cedula y contrasena son requeridas.' })
    }

    // Buscamos al miembro por su cedula.
    const miembro = await Miembro.findOne({ cedula: cedula.trim() })
    if (!miembro) {
      return res.status(401).json({ ok: false, mensaje: 'Cedula o contrasena incorrecta.' })
    }

    // Comparamos la contrasena recibida con el hash guardado.
    const passwordValida = await miembro.verificarPassword(password)
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: 'Cedula o contrasena incorrecta.' })
    }

    // Si la cuenta esta suspendida o cancelada, no dejamos entrar.
    if (miembro.estado !== 'activo') {
      return res.status(403).json({ ok: false, mensaje: 'Tu cuenta esta suspendida. Contacta a la biblioteca.' })
    }

    // Construimos el payload del JWT con la informacion que el frontend
    // necesita para mostrar el usuario (sin password).
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

    // Firmamos el token con expiracion de 7 dias.
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

    return res.json({ ok: true, token, user: payload })
  } catch (err) {
    console.error('Error en login:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
  }
})

export default router
