// Servidor del Plan B: API alternativa de LibraryHub sin MongoDB.
// Monta un Express con json-server como router para las rutas CRUD simples
// (categorias, libros, miembros) y rutas custom en Express para las que
// tienen logica de negocio (auth, prestamos, reservas, multas).
//
// La persistencia es inmediata en disco: cualquier cambio (prestamo,
// devolucion, reserva, multa) reescribe db.json de forma atomica.
//
// Los tokens JWT se firman con la misma JWT_SECRET que el backend de Mongo,
// asi un token sirve para ambos backends y se puede alternar VITE_API_URL
// sin tener que reloguear.

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jsonServer from 'json-server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { verifyToken, requireRole } from './middleware/auth.js'
import { toDate } from './utils/format.js'

// ── Setup ──────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const DB_PATH    = path.join(__dirname, 'db.json')
const SEED_PATH  = path.join(__dirname, 'db.seed.json')

const PORT = process.env.PORT ?? 5001

// Defaults por si no se define .env (asi funciona out-of-the-box).
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'libraryhub_dev_secret_key'

// ── Persistencia ───────────────────────────────────────────
// db.json vive en disco y se reescribe de forma atomica (escribimos a un
// archivo .tmp y lo renombramos). Asi evitamos corromper el archivo si el
// proceso muere a mitad de un write.

// Cache en memoria: arranca con el contenido del archivo, se mantiene en
// sync con disco. Las rutas custom leen y mutan este cache, y al final de
// cada mutacion llaman a writeDb() para bajarlo a disco.
let db = readDb()

function readDb() {
  const contenido = fs.readFileSync(DB_PATH, 'utf8')
  return JSON.parse(contenido)
}

function writeDb() {
  const tmp = `${DB_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, DB_PATH)
}

// Genera un id nuevo a partir del contador de la coleccion.
// json-server por defecto castea a numero, lo cual rompe cuando mezclamos
// ids numericos deprecados y nuevos. Por eso usamos ids string tipo "usr-7".
function nextId(coleccion, prefijo) {
  db._counters[coleccion] = (db._counters[coleccion] ?? 0) + 1
  return `${prefijo}-${db._counters[coleccion]}`
}

// ── App Express ────────────────────────────────────────────
const app = express()
app.disable('x-powered-by')

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── Helpers de formato ─────────────────────────────────────
// Mantienen la misma forma exacta de respuesta que el backend de Mongo,
// para que el frontend (apiService.js) no note la diferencia.

// Devuelve un libro con el nombre de la categoria desanidado, igual que
// formatLibro() en server/routes/libros.routes.js.
function formatLibro(libro) {
  const categoria = db.categorias.find(c => c.id === libro.categoria_id)
  return {
    id:                 libro.id,
    titulo:             libro.titulo,
    isbn:               libro.isbn ?? null,
    autores:            libro.autores ?? [],
    editorial:          libro.editorial ?? null,
    categoria:          categoria?.nombre ?? null,
    categoria_id:       libro.categoria_id ?? null,
    año_publicacion:    libro.año_publicacion ?? null,
    paginas:            libro.paginas ?? null,
    cantidad_copias:    libro.cantidad_copias,
    copias_disponibles: libro.copias_disponibles,
  }
}

function formatPrestamo(p) {
  const libro = db.libros.find(l => l.id === p.libro_id)
  return {
    id:                        p.id,
    miembro_id:                p.miembro_id,
    libro_id:                  p.libro_id,
    libro_titulo:              libro?.titulo ?? p.libro_titulo ?? null,
    fecha_prestamo:            toDate(p.fecha_prestamo),
    fecha_devolucion_esperada: toDate(p.fecha_devolucion_esperada),
    fecha_devolucion:          toDate(p.fecha_devolucion),
    estado:                    p.estado,
  }
}

function formatReserva(r) {
  const libro = db.libros.find(l => l.id === r.libro_id)
  return {
    id:                            r.id,
    miembro_id:                    r.miembro_id,
    libro_id:                      r.libro_id,
    libro_titulo:                  libro?.titulo ?? r.libro_titulo ?? null,
    fecha_reserva:                 toDate(r.fecha_reserva),
    posicion_cola:                 r.posicion_cola,
    estado:                        r.estado,
    fecha_estimada_disponibilidad: toDate(r.fecha_estimada_disponibilidad),
  }
}

function formatMulta(m) {
  return {
    id:         m.id,
    prestamo_id: m.prestamo_id,
    miembro_id:  m.miembro_id,
    monto:       m.monto,
    pagada:      m.pagada,
    fecha_pago:  toDate(m.fecha_pago),
  }
}

// ── RUTAS CUSTOM ───────────────────────────────────────────
// Estas rutas se montan ANTES del router de json-server, asi tienen
// precedencia sobre las rutas CRUD default.

// ── AUTH ───────────────────────────────────────────────────

// POST /api/auth/login
// Body: { cedula, password }
// Respuesta: { ok, token, user } (misma forma que el backend de Mongo).
app.post('/api/auth/login', async (req, res) => {
  try {
    const { cedula, password } = req.body ?? {}

    if (!cedula || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Cedula y contrasena son requeridas.' })
    }

    const miembro = db.miembros.find(m => m.cedula === String(cedula).trim())
    if (!miembro) {
      return res.status(401).json({ ok: false, mensaje: 'Cedula o contrasena incorrecta.' })
    }

    // Comparamos la contrasena recibida contra el hash guardado en db.json.
    const passwordValida = await bcrypt.compare(password, miembro.password_hash)
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: 'Cedula o contrasena incorrecta.' })
    }

    if (miembro.estado !== 'activo') {
      return res.status(403).json({ ok: false, mensaje: 'Tu cuenta esta suspendida. Contacta a la biblioteca.' })
    }

    // Mismo payload que el backend de Mongo (ver server/routes/auth.routes.js).
    const payload = {
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

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

    return res.json({ ok: true, token, user: payload })
  } catch (err) {
    console.error('Error en login:', err)
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
  }
})

// ── LIBROS — busqueda y filtro ────────────────────────────
// json-server permite `?titulo_like=foo` pero no es lo bastante flexible para
// la busqueda que usa el frontend (busca en titulo, autor e ISBN). Por eso
// manejamos esta ruta a mano y dejamos al router de json-server las demas.

app.get('/api/libros', verifyToken, (req, res) => {
  const { busqueda = '', categoria_id } = req.query
  let lista = db.libros.slice()

  if (busqueda.trim()) {
    const term = busqueda.trim().toLowerCase()
    lista = lista.filter(l => {
      if (l.titulo?.toLowerCase().includes(term)) return true
      if (l.isbn?.toLowerCase().includes(term))   return true
      if ((l.autores ?? []).some(a => a.toLowerCase().includes(term))) return true
      return false
    })
  }

  if (categoria_id) {
    lista = lista.filter(l => l.categoria_id === categoria_id)
  }

  lista.sort((a, b) => a.titulo.localeCompare(b.titulo))
  return res.json(lista.map(formatLibro))
})

// ── PRESTAMOS ─────────────────────────────────────────────

// GET /api/prestamos/me — prestamos del usuario logueado (no devueltos).
app.get('/api/prestamos/me', verifyToken, (req, res) => {
  const prestamos = db.prestamos
    .filter(p => p.miembro_id === req.user.id && p.estado !== 'devuelto')
    .map(formatPrestamo)
  return res.json(prestamos)
})

// GET /api/prestamos — todos los prestamos activos. Solo bibliotecario.
app.get('/api/prestamos', verifyToken, requireRole('bibliotecario'), (req, res) => {
  const prestamos = db.prestamos
    .filter(p => p.estado !== 'devuelto')
    .map(formatPrestamo)
  // Orden por fecha_devolucion_esperada ascendente (mismo criterio que Mongo).
  prestamos.sort((a, b) => (a.fecha_devolucion_esperada ?? '').localeCompare(b.fecha_devolucion_esperada ?? ''))
  return res.json(prestamos)
})

// POST /api/prestamos — solicitar un prestamo.
app.post('/api/prestamos', verifyToken, (req, res) => {
  const { libro_id } = req.body ?? {}
  if (!libro_id) {
    return res.status(400).json({ ok: false, mensaje: 'libro_id es requerido.' })
  }

  const libro = db.libros.find(l => l.id === libro_id)
  if (!libro) {
    return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado.' })
  }
  if (libro.copias_disponibles < 1) {
    return res.status(400).json({ ok: false, mensaje: 'No hay copias disponibles.' })
  }

  // Fecha de devolucion: hoy + 14 dias.
  const hoy = new Date()
  const venc = new Date(hoy)
  venc.setDate(venc.getDate() + 14)

  const prestamo = {
    id:                        nextId('prestamos', 'pre'),
    miembro_id:                req.user.id,
    libro_id:                  libro.id,
    libro_titulo:              libro.titulo,
    fecha_prestamo:            hoy.toISOString(),
    fecha_devolucion_esperada: venc.toISOString(),
    fecha_devolucion:          null,
    estado:                    'activo',
  }
  db.prestamos.push(prestamo)

  // Descontamos una copia disponible.
  libro.copias_disponibles = Math.max(0, libro.copias_disponibles - 1)

  writeDb()

  return res.status(201).json({
    ok:       true,
    mensaje:  'Prestamo registrado con exito.',
    prestamo: formatPrestamo(prestamo),
  })
})

// PATCH /api/prestamos/:id/renovar — extiende el prestamo 14 dias mas.
app.patch('/api/prestamos/:id/renovar', verifyToken, (req, res) => {
  const prestamo = db.prestamos.find(p => p.id === req.params.id)
  if (!prestamo) {
    return res.status(404).json({ ok: false, mensaje: 'Prestamo no encontrado.' })
  }

  const esDueno = prestamo.miembro_id === req.user.id
  if (!esDueno && req.user.rol !== 'bibliotecario') {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para renovar este prestamo.' })
  }

  if (prestamo.estado === 'devuelto') {
    return res.status(400).json({ ok: false, mensaje: 'No se puede renovar un prestamo ya devuelto.' })
  }

  const base = new Date(prestamo.fecha_devolucion_esperada)
  base.setDate(base.getDate() + 14)
  prestamo.fecha_devolucion_esperada = base.toISOString()
  prestamo.estado = 'activo'

  writeDb()

  return res.json({ ok: true, mensaje: 'Prestamo renovado por 14 dias mas.' })
})

// PATCH /api/prestamos/:id/devolver — registra la devolucion y genera multa
// si la fecha de hoy es posterior a la fecha_devolucion_esperada.
app.patch('/api/prestamos/:id/devolver', verifyToken, requireRole('bibliotecario'), (req, res) => {
  const prestamo = db.prestamos.find(p => p.id === req.params.id)
  if (!prestamo) {
    return res.status(404).json({ ok: false, mensaje: 'Prestamo no encontrado.' })
  }

  const hoy = new Date()
  prestamo.estado           = 'devuelto'
  prestamo.fecha_devolucion = hoy.toISOString()

  // Liberamos una copia del libro.
  const libro = db.libros.find(l => l.id === prestamo.libro_id)
  if (libro) {
    libro.copias_disponibles = Math.min(libro.cantidad_copias, libro.copias_disponibles + 1)
  }

  // Multa por atraso: $1.000 CLP por cada dia de retraso.
  const venc = new Date(prestamo.fecha_devolucion_esperada)
  if (hoy > venc) {
    const diasAtraso = Math.ceil((hoy - venc) / (1000 * 60 * 60 * 24))
    const monto      = diasAtraso * 1000
    db.multas.push({
      id:          nextId('multas', 'mul'),
      prestamo_id: prestamo.id,
      miembro_id:  prestamo.miembro_id,
      monto,
      pagada:      false,
      fecha_pago:  null,
    })
  }

  writeDb()

  return res.json({ ok: true, mensaje: 'Devolucion registrada correctamente.' })
})

// ── RESERVAS ──────────────────────────────────────────────

// GET /api/reservas/me — reservas activas del socio logueado.
app.get('/api/reservas/me', verifyToken, (req, res) => {
  const reservas = db.reservas
    .filter(r => r.miembro_id === req.user.id && r.estado === 'reservado')
    .map(formatReserva)
  reservas.sort((a, b) => a.posicion_cola - b.posicion_cola)
  return res.json(reservas)
})

// GET /api/reservas/libro/:libro_id — cola de reservas de un libro.
app.get('/api/reservas/libro/:libro_id', verifyToken, (req, res) => {
  const reservas = db.reservas
    .filter(r => r.libro_id === req.params.libro_id && r.estado === 'reservado')
    .map(formatReserva)
  reservas.sort((a, b) => a.posicion_cola - b.posicion_cola)
  return res.json(reservas)
})

// GET /api/reservas — todas las reservas activas. Solo bibliotecario.
app.get('/api/reservas', verifyToken, requireRole('bibliotecario'), (req, res) => {
  const reservas = db.reservas
    .filter(r => r.estado === 'reservado')
    .map(formatReserva)
  reservas.sort((a, b) => {
    if (a.libro_id !== b.libro_id) return a.libro_id.localeCompare(b.libro_id)
    return a.posicion_cola - b.posicion_cola
  })
  return res.json(reservas)
})

// POST /api/reservas — crear una reserva.
app.post('/api/reservas', verifyToken, (req, res) => {
  const { libro_id } = req.body ?? {}
  if (!libro_id) {
    return res.status(400).json({ ok: false, mensaje: 'libro_id es requerido.' })
  }

  // No se puede reservar dos veces el mismo libro.
  const yaReservado = db.reservas.find(
    r => r.miembro_id === req.user.id && r.libro_id === libro_id && r.estado === 'reservado'
  )
  if (yaReservado) {
    return res.status(400).json({ ok: false, mensaje: 'Ya tienes una reserva activa para este libro.' })
  }

  const libro = db.libros.find(l => l.id === libro_id)
  if (!libro) {
    return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado.' })
  }

  // Posicion = cuantas reservas hay antes + 1.
  const colaActual = db.reservas.filter(r => r.libro_id === libro_id && r.estado === 'reservado').length
  const posicion   = colaActual + 1

  // Estimacion: 14 dias por cada persona en la cola.
  const fechaEstimada = new Date()
  fechaEstimada.setDate(fechaEstimada.getDate() + posicion * 14)

  const reserva = {
    id:                            nextId('reservas', 'res'),
    miembro_id:                    req.user.id,
    libro_id:                      libro.id,
    libro_titulo:                  libro.titulo,
    fecha_reserva:                 new Date().toISOString(),
    posicion_cola:                 posicion,
    estado:                        'reservado',
    fecha_estimada_disponibilidad: fechaEstimada.toISOString(),
  }
  db.reservas.push(reserva)

  writeDb()

  return res.status(201).json({
    ok:      true,
    mensaje: `Reserva creada. Estas en posicion ${posicion} en la cola.`,
    reserva: formatReserva(reserva),
  })
})

// DELETE /api/reservas/:id — cancela una reserva (la marca como cancelado,
// no la borra, para mantener historial).
app.delete('/api/reservas/:id', verifyToken, (req, res) => {
  const reserva = db.reservas.find(r => r.id === req.params.id)
  if (!reserva) {
    return res.status(404).json({ ok: false, mensaje: 'Reserva no encontrada.' })
  }

  const esDueno = reserva.miembro_id === req.user.id
  if (!esDueno && req.user.rol !== 'bibliotecario') {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para cancelar esta reserva.' })
  }

  reserva.estado = 'cancelado'

  writeDb()

  return res.json({ ok: true, mensaje: 'Reserva cancelada.' })
})

// ── MULTAS ────────────────────────────────────────────────

// GET /api/multas/me — multas pendientes del socio logueado.
app.get('/api/multas/me', verifyToken, (req, res) => {
  const multas = db.multas
    .filter(m => m.miembro_id === req.user.id && m.pagada === false)
    .map(formatMulta)
  return res.json(multas)
})

// GET /api/multas — todas las multas pendientes. Solo bibliotecario.
app.get('/api/multas', verifyToken, requireRole('bibliotecario'), (req, res) => {
  const multas = db.multas
    .filter(m => m.pagada === false)
    .map(formatMulta)
  return res.json(multas)
})

// ── MIEMBROS ──────────────────────────────────────────────

// GET /api/miembros — solo bibliotecario, excluye al bibliotecario.
app.get('/api/miembros', verifyToken, requireRole('bibliotecario'), (req, res) => {
  const miembros = db.miembros
    .filter(m => m.rol === 'miembro')
    .map(m => ({
      id:             m.id,
      cedula:         m.cedula,
      nombre:         m.nombre,
      email:          m.email,
      telefono:       m.telefono,
      tipo_membresia: m.tipo_membresia,
      estado:         m.estado,
      fecha_registro: toDate(m.fecha_registro),
    }))
  miembros.sort((a, b) => a.nombre.localeCompare(b.nombre))
  return res.json(miembros)
})

// ── RUTAS SIMPLES (categorias, libro por id) ──────────────
// Las manejamos a mano para tener control sobre el formato de salida y
// agregar el requireAuth. json-server sigue activo para las rutas CRUD
// que el frontend no usa.

// GET /api/categorias
app.get('/api/categorias', verifyToken, (req, res) => {
  const categorias = db.categorias
    .map(c => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  return res.json(categorias)
})

// GET /api/libros/:id
app.get('/api/libros/:id', verifyToken, (req, res) => {
  const libro = db.libros.find(l => l.id === req.params.id)
  if (!libro) {
    return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado.' })
  }
  return res.json(formatLibro(libro))
})

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, mensaje: 'LibraryHub Plan B (json-server) funcionando.' }))

// ── Router default de json-server ─────────────────────────
// Lo montamos AL FINAL, asi nuestras rutas custom tienen precedencia.
// Excluimos /api/auth, /api/prestamos, /api/reservas, /api/multas, /api/miembros
// y /api/categorias del rewrite default para que no haya doble manejo.
const router = jsonServer.router(DB_PATH)
const rewriter = jsonServer.rewriter({
  '/api/*': '/$1',
})
app.use(rewriter)
app.use((req, res, next) => {
  // Si llegamos aca con una ruta /api/... y no fue respondida, dejamos que
  // json-server la maneje. Pero filtramos las que ya manejamos arriba.
  const path = req.path
  const customHandled = [
    '/api/auth/login',
    '/api/prestamos', '/api/prestamos/me',
    '/api/reservas', '/api/reservas/me',
    '/api/multas', '/api/multas/me',
    '/api/miembros',
    '/api/categorias',
    '/api/libros',
  ].some(p => path === p || path.startsWith(p + '/'))
  if (customHandled) {
    return res.status(404).json({ ok: false, mensaje: `Ruta ${path} no encontrada.` })
  }
  return router(req, res, next)
})

// ── 404 final ─────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ ok: false, mensaje: `Ruta ${req.path} no encontrada.` }))

// ── Error handler ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Error no manejado:', err)
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
})

// ── Arranque ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`LibraryHub Plan B corriendo en http://localhost:${PORT}`)
  console.log('Backend basado en json-server + db.json (no requiere MongoDB).')
  console.log('Para usarlo, configura VITE_API_URL=http://localhost:' + PORT + '/api en el frontend.')
})
