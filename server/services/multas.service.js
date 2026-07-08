// Servicio de multas.
// Los socios consultan sus multas pendientes. El bibliotecario ve todas.

import Multa from '../models/Multa.js'
import { requerirSesion, requerirRol } from './sesion.service.js'
import { toDate } from '../utils/format.js'

function formatMulta(m) {
  return {
    id:              m.id,
    prestamo_id:     m.prestamo?._id?.toString() ?? m.prestamo?.toString(),
    miembro_id:      m.miembro?._id?.toString()  ?? m.miembro?.toString(),
    miembro_nombre:  m.miembro?.nombre ?? null,
    monto:           m.monto,
    pagada:          m.pagada,
    fecha_pago:      toDate(m.fecha_pago),
  }
}

/**
 * Devuelve las multas pendientes (no pagadas) del socio logueado.
 * @returns {Promise<Array<object>>}
 */
export async function getMultasByMiembro() {
  const usuarioActual = requerirSesion()
  const multas = await Multa.find({ miembro: usuarioActual.id, pagada: false })
  return multas.map(formatMulta)
}

/**
 * Devuelve todas las multas pendientes del sistema. Solo para bibliotecarios.
 * @returns {Promise<Array<object>>}
 */
export async function getTodasMultas() {
  requerirRol('bibliotecario')
  const multas = await Multa.find({ pagada: false })
    .populate('miembro',  'nombre cedula')
    .populate('prestamo', 'fecha_devolucion_esperada')
    .sort({ createdAt: -1 })

  return multas.map(formatMulta)
}
