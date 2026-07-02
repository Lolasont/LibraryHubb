import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { conectarDB } from './config/db.js'

// Rutas
import authRoutes       from './routes/auth.routes.js'
import categoriasRoutes from './routes/categorias.routes.js'
import librosRoutes     from './routes/libros.routes.js'
import prestamosRoutes  from './routes/prestamos.routes.js'
import reservasRoutes   from './routes/reservas.routes.js'
import multasRoutes     from './routes/multas.routes.js'
import miembrosRoutes   from './routes/miembros.routes.js'

const app  = express()
const PORT = process.env.PORT ?? 5000

// ── Middleware global ─────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }))   // puerto por defecto de Vite
app.use(express.json())

// ── Rutas API ─────────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/libros',     librosRoutes)
app.use('/api/prestamos',  prestamosRoutes)
app.use('/api/reservas',   reservasRoutes)
app.use('/api/multas',     multasRoutes)
app.use('/api/miembros',   miembrosRoutes)

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, mensaje: 'LibraryHub API funcionando.' }))

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ ok: false, mensaje: `Ruta ${req.path} no encontrada.` }))

// ── Error handler global ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Error no manejado:', err)
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
})

// ── Arrancar el servidor ─────────────────────────────────────────────
conectarDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    console.log(`📚 LibraryHub API lista`)
  })
})
