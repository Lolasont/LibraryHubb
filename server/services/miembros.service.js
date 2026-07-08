// Servicio de miembros.
// El bibliotecario consulta el listado completo de socios del sistema.

import Miembro from '../models/Miembro.js'
import { requerirRol } from './sesion.service.js'
import { toDate } from '../utils/format.js'

/**
 * Devuelve la lista de socios. Excluye al bibliotecario (solo trae rol "miembro").
 * Solo accesible para el bibliotecario.
 * @returns {Promise<Array<object>>}
 */
export async function listarMiembros() {
  requerirRol('bibliotecario')
  const miembros = await Miembro.find({ rol: 'miembro' }).sort({ nombre: 1 })
  // El modelo ya se encarga de eliminar el password en su transformacion a JSON.
  return miembros.map(m => ({
    id:             m.id,
    cedula:         m.cedula,
    nombre:         m.nombre,
    email:          m.email,
    telefono:       m.telefono,
    tipo_membresia: m.tipo_membresia,
    estado:         m.estado,
    fecha_registro: toDate(m.fecha_registro),
  }))
}
