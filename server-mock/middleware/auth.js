// Middleware de autenticacion.
// Identico a server/middleware/auth.js. No depende de Mongoose — solo
// de jsonwebtoken y de la variable de entorno JWT_SECRET.
// Como ambos backends usan la misma JWT_SECRET, un token firmado por el
// Plan B es valido en el backend de Mongo y viceversa.

import jwt from 'jsonwebtoken'

// Verifica el JWT del header Authorization y guarda el payload en req.user.
// Asi los endpoints siguientes pueden saber quien es el usuario logueado.
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'Token de autenticacion requerido.' })
  }

  // El header tiene la forma "Bearer <token>". Nos quedamos con la segunda parte.
  const token = authHeader.split(' ')[1]

  try {
    // jwt.verify decodifica el token y verifica la firma con JWT_SECRET.
    // Si la firma no coincide o el token expiro, tira un error.
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ ok: false, mensaje: 'Token invalido o expirado.' })
  }
}

// Restringe el acceso a usuarios con un rol determinado.
// Siempre se usa despues de verifyToken, porque necesita que req.user exista.
// Ejemplo de uso:  router.get('/admin', verifyToken, requireRole('bibliotecario'), handler)
export function requireRole(rol) {
  return (req, res, next) => {
    if (req.user?.rol !== rol) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta accion.' })
    }
    next()
  }
}
