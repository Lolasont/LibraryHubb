// Servicio de categorias.
// Lista todas las categorias de libros que existen en el sistema.

import Categoria from '../models/Categoria.js'
import { requerirSesion } from './sesion.service.js'

/**
 * Devuelve las categorias ordenadas alfabeticamente.
 * Antes estaba protegido por verifyToken; ahora se requiere sesion activa.
 * @returns {Promise<Array<{ id: string, nombre: string, descripcion?: string }>>}
 */
export async function listarCategorias() {
  requerirSesion()
  const categorias = await Categoria.find().sort({ nombre: 1 })
  return categorias.map(c => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion }))
}
