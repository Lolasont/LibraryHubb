// Servicio de sesion.
// Antes la identidad del usuario se demostraba en cada peticion HTTP
// mediante un JWT (ver middleware/auth.js). Ahora que todo corre dentro
// de un mismo proceso de Electron no hay red de por medio, asi que no
// hace falta un token: alcanza con recordar en memoria quien esta
// logueado en este momento.
//
// Esta variable vive en el proceso principal de Electron. Cualquier
// service que la necesite la obtiene mediante requerirSesion().

let usuarioActual = null

/**
 * Registra al usuario como sesion activa.
 * Llamado por auth.service.js al validar el login.
 * @param {{ id: string, rol: string, ... }} usuario
 */
export function setUsuarioActual(usuario) {
  usuarioActual = usuario
}

/**
 * Devuelve el usuario logueado en este momento, o null si no hay nadie.
 * @returns {{ id: string, rol: string, ... } | null}
 */
export function getUsuarioActual() {
  return usuarioActual
}

/**
 * Cierra la sesion actual. Llamado por el canal de logout (futuro).
 */
export function cerrarSesion() {
  usuarioActual = null
}

/**
 * Lanza un error si no hay nadie logueado. Usar al principio de cualquier
 * service que antes tenia verifyToken.
 * @returns {{ id: string, rol: string, ... }}
 */
export function requerirSesion() {
  if (!usuarioActual) {
    throw new Error('No hay una sesion activa.')
  }
  return usuarioActual
}

/**
 * Lanza un error si el usuario logueado no tiene el rol pedido.
 * Usar al principio de cualquier service que antes tenia requireRole(...).
 * @param {'miembro' | 'bibliotecario'} rol
 * @returns {{ id: string, rol: string, ... }}
 */
export function requerirRol(rol) {
  const usuario = requerirSesion()
  if (usuario.rol !== rol) {
    throw new Error(`Esta accion requiere el rol "${rol}".`)
  }
  return usuario
}
