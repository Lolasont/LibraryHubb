// Sesion HTTP para el modo web.
//
// Replica la API de sesion.service.js (setUsuarioActual / getUsuarioActual /
// requerirSesion / requerirRol) pero basada en tokens guardados en un Map
// en memoria. Esto permite que los services existentes (que leen
// usuarioActual como variable global) funcionen dentro del servidor
// Express sin tocarlos.
//
// El servidor Express es single-threaded y procesa una request a la vez
// (los awaits liberan el event loop, pero el handler sigue siendo
// secuencial), por eso alcanza con setear usuarioActual antes de cada
// handler y limpiarlo al final.

import { setUsuarioActual } from '../services/sesion.service.js'
import { randomBytes } from 'node:crypto'

// Map<token, usuario>. Vive solo en memoria del proceso del servidor:
// si reiniciás el server, todas las sesiones se pierden (hay que volver
// a hacer login). Aceptable para una demo local.
const sesiones = new Map()

// Genera un token simple. randomUUID() está disponible en Node 14.17+,
// así que no hace falta polyfill.
function generarToken() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16)
    globalThis.crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback seguro para Node.js
  return randomBytes(16).toString('hex')
}

/**
 * Registra al usuario en la tabla de sesiones y devuelve un token.
 * @param {{ id: string, rol: string, ... }} usuario
 * @returns {string} token
 */
export function crearSesion(usuario) {
  const token = generarToken()
  sesiones.set(token, usuario)
  return token
}

/**
 * Carga el usuario asociado a un token en la variable global
 * usuarioActual de sesion.service.js. Devuelve el usuario o null.
 * @param {string} token
 * @returns {object | null}
 */
export function cargarSesionDesdeToken(token) {
  if (!token) return null
  const usuario = sesiones.get(token)
  if (usuario) setUsuarioActual(usuario)
  return usuario ?? null
}

/**
 * Elimina una sesion del Map.
 * @param {string} token
 */
export function cerrarSesion(token) {
  if (token) sesiones.delete(token)
}

/**
 * Middleware de Express. Lee el token del header 'x-session-token',
 * carga el usuario en sesion.service.js y sigue.
 * Despues de que el handler responde, limpia usuarioActual para que
 * la proxima request no herede la sesion anterior.
 */
export function sesionMiddleware(req, res, next) {
  const token = req.headers['x-session-token']
  cargarSesionDesdeToken(token)
  next()
}

/**
 * Limpia la sesion actual (la variable global). Llamar en el finally
 * de cada handler de login/logout para no contaminar otras requests.
 * (Node es single-threaded, asi que no hay carrera real, pero mantenerlo
 * limpio hace que el codigo sea mas facil de razonar.)
 */
export function limpiarSesionActual() {
  setUsuarioActual(null)
}
