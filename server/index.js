// Servidor HTTP (Express) — modo web de LibraryHub.
//
// Este server existe para que la app pueda correr en un navegador
// (http://localhost:5173) sin Electron. Reutiliza TODOS los services
// de server/services/ tal cual estan: la unica diferencia con el modo
// Electron es que la "sesion" pasa de vivir en una variable global del
// proceso main a un Map de tokens (ver sesion-http.js).
//
// Cada endpoint:
//  1. Carga el usuarioActual en base al token del header (sesion-http).
//  2. Llama al service correspondiente.
//  3. Convierte errores en { ok: false, mensaje }.
//  4. Limpia usuarioActual al final (finally).
//
// Levanta en el puerto 3000 por default, o el de la variable PORT.

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { conectarDB } from './config/db.js'

// Services — los mismos que usa Electron via IPC.
import * as authService      from './services/auth.service.js'
import * as categoriasService from './services/categorias.service.js'
import * as librosService     from './services/libros.service.js'
import * as prestamosService  from './services/prestamos.service.js'
import * as reservasService   from './services/reservas.service.js'
import * as multasService     from './services/multas.service.js'
import * as miembrosService   from './services/miembros.service.js'

import {
  sesionMiddleware,
  crearSesion,
  cerrarSesion,
  limpiarSesionActual,
} from './middleware/sesion-http.js'

// ── Bootstrap ────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

await conectarDB()

const app  = express()
const PORT = process.env.PORT ?? 3000

// CORS: permitimos que Vite (puerto 5173) nos llame.
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}))

// Parseo de body en JSON.
app.use(express.json())

// Middleware que setea usuarioActual antes de cada request.
app.use(sesionMiddleware)

// Health check util para verificar que el server esta vivo.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mensaje: 'API LibraryHub funcionando.' })
})

// ── Helpers ──────────────────────────────────────────────────

// Wrapper que ejecuta el handler, captura errores y limpia la sesion.
// Asi replicamos el "conManejorDeErrores" de main.cjs pero en HTTP.
function safe(fn) {
  return async (req, res) => {
    try {
      await fn(req, res)
    } catch (error) {
      console.error('Error en endpoint:', error)
      res.json({ ok: false, mensaje: error?.message ?? 'Error inesperado.' })
    } finally {
      limpiarSesionActual()
    }
  }
}

// ── AUTH ─────────────────────────────────────────────────────

app.post('/api/auth/login', safe(async (req, res) => {
  const { cedula, password } = req.body ?? {}
  const result = await authService.login(cedula, password)
  if (result.ok) {
    const token = crearSesion(result.user)
    return res.json({ ...result, token })
  }
  res.json(result)
}))

app.post('/api/auth/restaurar-sesion', safe(async (req, res) => {
  const { userId } = req.body ?? {}
  const result = await authService.restaurarSesion(userId)
  if (result.ok) {
    // Re-creamos un token para que el cliente lo guarde.
    const token = crearSesion(result.user)
    return res.json({ ...result, token })
  }
  res.json(result)
}))

app.post('/api/auth/logout', safe(async (req, res) => {
  const token = req.headers['x-session-token']
  cerrarSesion(token)
  res.json({ ok: true, mensaje: 'Sesion cerrada.' })
}))

// ── CATEGORIAS ───────────────────────────────────────────────

app.get('/api/categorias', safe(async (_req, res) => {
  const data = await categoriasService.listarCategorias()
  res.json(data)
}))

// ── LIBROS ───────────────────────────────────────────────────

app.get('/api/libros', safe(async (req, res) => {
  const { busqueda = '', categoria_id = null } = req.query
  const data = await librosService.buscarLibros({ busqueda, categoria_id })
  res.json(data)
}))

app.get('/api/libros/:id', safe(async (req, res) => {
  const data = await librosService.getLibroById(req.params.id)
  res.json(data)
}))

// ── PRESTAMOS ────────────────────────────────────────────────

app.get('/api/prestamos/mis-activos', safe(async (_req, res) => {
  const data = await prestamosService.getPrestamosActivos()
  res.json(data)
}))

app.get('/api/prestamos/todos', safe(async (_req, res) => {
  const data = await prestamosService.getTodosPrestamos()
  res.json(data)
}))

app.post('/api/prestamos/solicitar', safe(async (req, res) => {
  const { libro_id } = req.body ?? {}
  const data = await prestamosService.solicitarPrestamo(libro_id)
  res.json(data)
}))

app.post('/api/prestamos/:id/renovar', safe(async (req, res) => {
  const data = await prestamosService.renovarPrestamo(req.params.id)
  res.json(data)
}))

app.post('/api/prestamos/:id/devolver', safe(async (req, res) => {
  const data = await prestamosService.registrarDevolucion(req.params.id)
  res.json(data)
}))

// ── RESERVAS ─────────────────────────────────────────────────

app.get('/api/reservas/mis-reservas', safe(async (_req, res) => {
  const data = await reservasService.getReservasByMiembro()
  res.json(data)
}))

app.get('/api/reservas/por-libro/:libroId', safe(async (req, res) => {
  const data = await reservasService.getReservasByLibro(req.params.libroId)
  res.json(data)
}))

app.get('/api/reservas/todas', safe(async (_req, res) => {
  const data = await reservasService.getTodasReservas()
  res.json(data)
}))

app.post('/api/reservas', safe(async (req, res) => {
  const { libro_id } = req.body ?? {}
  const data = await reservasService.hacerReserva(libro_id)
  res.json(data)
}))

app.post('/api/reservas/:id/cancelar', safe(async (req, res) => {
  const data = await reservasService.cancelarReserva(req.params.id)
  res.json(data)
}))

// ── MULTAS ───────────────────────────────────────────────────

app.get('/api/multas/mis-multas', safe(async (_req, res) => {
  const data = await multasService.getMultasByMiembro()
  res.json(data)
}))

app.get('/api/multas/todas', safe(async (_req, res) => {
  const data = await multasService.getTodasMultas()
  res.json(data)
}))

// ── MIEMBROS ─────────────────────────────────────────────────

app.get('/api/miembros', safe(async (_req, res) => {
  const data = await miembrosService.listarMiembros()
  res.json(data)
}))

// ── 404 para rutas /api no encontradas ───────────────────────

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Endpoint no encontrado.' })
})

// ── Levantar el server ───────────────────────────────────────

app.listen(PORT, () => {
  console.log(`API LibraryHub escuchando en http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})
