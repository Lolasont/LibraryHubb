// Servicio de multas.
// Los socios consultan sus multas pendientes. El bibliotecario ve todas.

import Multa from '../models/Multa.js'
import { requerirSesion, requerirRol } from './sesion.service.js'
import { toDate } from '../utils/format.js'
import * as exchange from './exchange.service.js'

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

/**
 * Crea una multa, convirtiendo el monto a la moneda local (CLP) si es que
 * viene en otra moneda. Si la conversion falla (por ejemplo, sin conexion
 * a internet), se persiste igual asumiendo que el monto ya esta en CLP.
 * @param {{prestamoId:string, miembroId:string, monto:number, monedaOrigen?:string}} datos
 * @returns {Promise<object>} La multa creada, con el formato estandar.
 */
export async function crearMulta({ prestamoId, miembroId, monto, monedaOrigen = 'CLP' }) {
  const resultado = await exchange.convertirAmonedaLocal(monto, monedaOrigen)

  let montoFinal = monto
  if (resultado.ok) {
    montoFinal = resultado.monto
    if (monedaOrigen !== 'CLP') {
      console.log(`[exchange] ${monto} ${monedaOrigen} -> ${montoFinal} CLP`)
    }
  } else {
    console.warn(`[exchange] No se pudo convertir ${monto} ${monedaOrigen} a CLP: ${resultado.error}. Se asume monto en CLP.`)
  }

  const multa = await Multa.create({
    prestamo: prestamoId,
    miembro:  miembroId,
    monto:    montoFinal,
    pagada:   false,
  })

  return formatMulta(multa)
}
