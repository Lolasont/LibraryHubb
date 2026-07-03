import jwt from 'jsonwebtoken'

/**
 * Verifica el JWT del header Authorization.
 * Adjunta el payload decodificado a req.user.
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'Token de autenticación requerido.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado.' })
  }
}

/**
 * Middleware de rol. Usar después de verifyToken.
 * Ejemplo: router.get('/admin', verifyToken, requireRole('bibliotecario'), handler)
 */
export function requireRole(rol) {
  return (req, res, next) => {
    if (req.user?.rol !== rol) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta acción.' })
    }
    next()
  }
}
