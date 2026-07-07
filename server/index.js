// Punto de entrada del backend.
// Acá se configura Express, se monta cada router en su ruta correspondiente
// y se inicia la conexion a MongoDB antes de abrir el puerto HTTP.

// ──────────────────────────────────────────────────────────────────
// AMPLIACION DEL ALCANCE ORIGINAL
// El enunciado del caso pedia unicamente el frontend de una biblioteca
// digital municipal (5 vistas: Login, Buscar Libros, Detalle de Libro,
// Mi Perfil y Mis Reservas), usando una API publica de conversion de
// moneda para las multas. Este backend completo no formaba parte de
// ese enunciado. Se conserva porque esta completamente integrado al
// sistema y el equipo decidio mantenerlo como valor anadido del
// proyecto, no porque haya sido requerido originalmente.
// ──────────────────────────────────────────────────────────────────

import 'dotenv/config'                              // Carga las variables del archivo .env
import express from 'express'
import cors from 'cors'
import { conectarDB } from './config/db.js'

// Routers (uno por modulo de la API).
import authRoutes       from './routes/auth.routes.js'
import categoriasRoutes from './routes/categorias.routes.js'
import librosRoutes     from './routes/libros.routes.js'
import prestamosRoutes  from './routes/prestamos.routes.js'
import reservasRoutes   from './routes/reservas.routes.js'
import multasRoutes     from './routes/multas.routes.js'
import miembrosRoutes   from './routes/miembros.routes.js'

const app  = express()
app.disable('x-powered-by')
const PORT = process.env.PORT ?? 5000

// ── Middlewares globales ───────────────────────────────────
// CORS abierto: aceptamos peticiones desde cualquier origen (localhost, tuneles
// de VS Code, deploys publicos, etc.). El backend no usa cookies de sesion —
// la auth va por JWT en el header Authorization — asi que no hay riesgo de
// CSRF por relajar el origin. Si mas adelante se anade auth por cookies,
// habra que volver a la lista blanca.
app.use(cors({ origin: '*' }))
// Habilita el parseo automatico de JSON en el body de las peticiones.
app.use(express.json())

// ── Rutas de la API ────────────────────────────────────────
// Cada router agrupa los endpoints de un modulo. Todos viven bajo /api.
app.use('/api/auth',       authRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/libros',     librosRoutes)
app.use('/api/prestamos',  prestamosRoutes)
app.use('/api/reservas',   reservasRoutes)
app.use('/api/multas',     multasRoutes)
app.use('/api/miembros',   miembrosRoutes)

// Endpoint de salud. Util para verificar que el servidor responde.
app.get('/api/health', (_, res) => res.json({ ok: true, mensaje: 'LibraryHub API funcionando.' }))

// Si la ruta no coincide con ninguna, devolvemos un 404 controlado.
app.use((req, res) => res.status(404).json({ ok: false, mensaje: `Ruta ${req.path} no encontrada.` }))

// Error handler final. Si algo explota en algun middleware, cae aca
// y devolvemos un mensaje generico al cliente (no la traza interna).
app.use((err, req, res, _next) => {
  console.error('Error no manejado:', err)
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
})

// Primero conectamos a MongoDB y recien despues abrimos el puerto.
// Asi evitamos aceptar peticiones antes de tener la base de datos lista.
try {
  await conectarDB()
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
    console.log('LibraryHub API lista')
  })
} catch (err) {
  console.error('Error al conectar a la base de datos:', err)
  process.exit(1)
}
