// Servicio de libros.
// Lista libros con busqueda y filtro por categoria, y devuelve el detalle.

import Libro from '../models/Libro.js'
import { requerirSesion } from './sesion.service.js'

// Cuando el usuario busca por texto, ese texto se usa dentro de un $regex de Mongo.
// Si no escapamos los caracteres especiales, un usuario podria provocar
// una inyeccion de regex o ataques de tipo ReDoS (Regular Expression Denial of Service).
// Esta funcion los neutraliza agregando un backslash antes de cada uno.
function escapeRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

// Convierte un documento Libro de Mongo al formato que espera el frontend.
// Hace un flatten de la categoria: en vez de devolver un objeto {id, nombre},
// devuelve dos campos separados (categoria_id y categoria con el nombre).
//
// IMPORTANTE: todos los campos que arma esta funcion tienen que ser tipos
// planos (string, number, boolean, array/objeto plano, o null). Este
// objeto viaja de vuelta al renderer via IPC, que usa el algoritmo de
// "structured clone" del navegador — y ese algoritmo NO puede clonar
// instancias de MongooseArray/MongooseDocument (fallan con el error
// "An object could not be cloned"), aunque por fuera parezcan un array
// o un objeto comun. Por eso "autores" se vuelve a armar explicitamente
// con Array.from(): eso garantiza un Array nativo, sin el envoltorio de
// Mongoose por dentro.
function formatLibro(libro) {
  return {
    id:                  libro.id,
    titulo:              libro.titulo,
    isbn:                libro.isbn ?? null,
    autores:             Array.isArray(libro.autores) ? Array.from(libro.autores) : [],
    editorial:           libro.editorial ?? null,
    categoria:           libro.categoria?.nombre ?? null,
    categoria_id:        libro.categoria?.id ?? null,
    año_publicacion:     libro.año_publicacion ?? null,
    paginas:             libro.paginas ?? null,
    cantidad_copias:     libro.cantidad_copias,
    copias_disponibles:  libro.copias_disponibles,
  }
}

/**
 * Busca libros con filtros opcionales.
 * @param {{ busqueda?: string, categoria_id?: string }} filtros
 * @returns {Promise<Array<object>>}
 */
export async function buscarLibros(filtros = {}) {
  requerirSesion()
  const { busqueda = '', categoria_id } = filtros
  const filtro = {}

  if (busqueda.trim()) {
    const termino = escapeRegex(busqueda.trim())
    filtro.$or = [
      { titulo:  { $regex: termino, $options: 'i' } },
      { autores: { $regex: termino, $options: 'i' } },
      { isbn:    { $regex: termino, $options: 'i' } },
    ]
  }

  if (categoria_id) {
    filtro.categoria = categoria_id
  }

  const libros = await Libro.find(filtro)
    .populate('categoria', 'nombre')
    .sort({ titulo: 1 })

  return libros.map(formatLibro)
}

/**
 * Devuelve el detalle de un libro puntual.
 * @param {string} id
 * @returns {Promise<{ ok: boolean, mensaje?: string } & object>}
 *   Si no se encuentra, devuelve { ok: false, mensaje }.
 */
export async function getLibroById(id) {
  requerirSesion()
  const libro = await Libro.findById(id).populate('categoria', 'nombre')
  if (!libro) {
    return { ok: false, mensaje: 'Libro no encontrado.' }
  }
  return { ...formatLibro(libro), ok: true }
}
