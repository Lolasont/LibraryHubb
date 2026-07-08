// Servicio de autenticacion.
// Hoy solo expone el login.
// Antes firmaba un JWT para que el frontend pudiera identificar al usuario
// en cada peticion HTTP. Ahora que todo corre dentro de un mismo proceso de
// Electron no hace falta: alcanza con guardar al usuario en memoria (ver
// sesion.service.js) y devolverlo al frontend para que lo guarde en
// localStorage.

import Miembro from '../models/Miembro.js'
import { setUsuarioActual } from './sesion.service.js'

/**
 * Valida cedula y contrasena contra la base de datos.
 * Si son correctas, registra al usuario como sesion activa y lo devuelve
 * (sin password) junto con un ok=true.
 * @param {string} cedula
 * @param {string} password
 * @returns {Promise<{ ok: boolean, mensaje: string, user?: object, token?: null }>}
 */
export async function login(cedula, password) {
  if (!cedula || !password) {
    return { ok: false, mensaje: 'Cedula y contrasena son requeridas.' }
  }

  // Buscamos al miembro por su cedula.
  const miembro = await Miembro.findOne({ cedula: cedula.trim() })
  if (!miembro) {
    return { ok: false, mensaje: 'Cedula o contrasena incorrecta.' }
  }

  // Comparamos la contrasena recibida con el hash guardado.
  const passwordValida = await miembro.verificarPassword(password)
  if (!passwordValida) {
    return { ok: false, mensaje: 'Cedula o contrasena incorrecta.' }
  }

  // Si la cuenta esta suspendida o cancelada, no dejamos entrar.
  if (miembro.estado !== 'activo') {
    return { ok: false, mensaje: 'Tu cuenta esta suspendida. Contacta a la biblioteca.' }
  }

  // Armamos el objeto de usuario que el frontend necesita para mostrar
  // quien esta logueado (sin password). El modelo ya elimina el password
  // en su transformacion a JSON, pero construimos un payload explicito
  // para no depender de eso.
  const user = {
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

  // Registramos al usuario como sesion activa en el proceso principal de
  // Electron. Asi los services que llamen a requerirSesion() lo veran.
  setUsuarioActual(user)

  // Devolvemos el mismo shape que antes (ok + user) para que el frontend
  // no tenga que cambiar nada. No hay token: en IPC no hace falta.
  return { ok: true, mensaje: 'Login exitoso.', user, token: null }
}

/**
 * Vuelve a registrar como sesion activa a un usuario que ya se habia
 * logueado antes, usando solo su id (lo que quedo guardado en el
 * localStorage del renderer).
 *
 * Hace falta porque usuarioActual vive en memoria del proceso principal
 * de Electron: si la ventana se recarga (hot-reload en desarrollo, o un
 * reinicio de la app) sin que el proceso principal se reinicie del todo,
 * o si el usuario reabre la app y el AuthContext restaura la sesion desde
 * localStorage, usuarioActual puede haber quedado en null mientras el
 * renderer todavia "cree" que hay alguien logueado. Sin esto, cualquier
 * service que llame a requerirSesion()/requerirRol() corta con un error
 * aunque el usuario nunca haya cerrado sesion realmente.
 *
 * A proposito NO confiamos ciegamente en los datos que manda el renderer
 * (podrian estar desactualizados, o el rol podria haber cambiado): se
 * vuelve a buscar al miembro por id y se valida que siga activo, igual
 * que en login().
 *
 * @param {string} userId
 * @returns {Promise<{ ok: boolean, mensaje?: string, user?: object }>}
 */
export async function restaurarSesion(userId) {
  if (!userId) {
    return { ok: false, mensaje: 'No hay id de usuario para restaurar.' }
  }

  const miembro = await Miembro.findById(userId)
  if (!miembro) {
    return { ok: false, mensaje: 'El usuario ya no existe.' }
  }

  if (miembro.estado !== 'activo') {
    return { ok: false, mensaje: 'Tu cuenta esta suspendida. Contacta a la biblioteca.' }
  }

  const user = {
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

  setUsuarioActual(user)

  return { ok: true, user }
}
