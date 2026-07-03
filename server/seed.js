/**
 * SEED — pobla la base de datos con datos iniciales.
 * Ejecutar UNA sola vez: npm run seed
 * ⚠️  Borra y recrea todas las colecciones.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { conectarDB } from './config/db.js'

import Categoria from './models/Categoria.js'
import Miembro   from './models/Miembro.js'
import Libro     from './models/Libro.js'
import Prestamo  from './models/Prestamo.js'
import Reserva   from './models/Reserva.js'
import Multa     from './models/Multa.js'

async function seed() {
  await conectarDB()

  // ── Limpiar colecciones ───────────────────────────────────
  console.log('🧹 Limpiando colecciones...')
  await Promise.all([
    Categoria.deleteMany({}),
    Miembro.deleteMany({}),
    Libro.deleteMany({}),
    Prestamo.deleteMany({}),
    Reserva.deleteMany({}),
    Multa.deleteMany({}),
  ])

  // ── Categorías ───────────────────────────────────────────
  console.log('📂 Insertando categorías...')
  const cats = await Categoria.insertMany([
    { nombre: 'Ficción',    descripcion: 'Novelas y relatos' },
    { nombre: 'Técnica',    descripcion: 'Libros de computación' },
    { nombre: 'Historia',   descripcion: 'Libros históricos' },
    { nombre: 'Ciencia',    descripcion: 'Libros científicos' },
    { nombre: 'Filosofía',  descripcion: 'Filosofía y pensamiento' },
  ])
  const cat = nombre => cats.find(c => c.nombre === nombre)._id

  // ── Miembros ─────────────────────────────────────────────
  // El pre-save hook hashea las contraseñas automáticamente
  console.log('👥 Insertando miembros...')
  const miembros = await Promise.all([
    Miembro.create({ cedula: '12345678', password: '12345678', nombre: 'Juan Pérez',      email: 'juan@example.com',   telefono: '+56 9 1234 5678', direccion: 'Av. Principal 123, Santiago',       tipo_membresia: 'basica',     rol: 'miembro',       fecha_registro: '2023-01-15' }),
    Miembro.create({ cedula: '23456789', password: '23456789', nombre: 'María García',     email: 'maria@example.com',  telefono: '+56 9 9876 5432', direccion: 'Calle Los Álamos 456, Providencia', tipo_membresia: 'premium',    rol: 'miembro',       fecha_registro: '2022-08-20' }),
    Miembro.create({ cedula: '34567890', password: '34567890', nombre: 'Carlos López',     email: 'carlos@example.com', telefono: '+56 9 5555 1234', direccion: 'Pasaje Sur 789, Las Condes',        tipo_membresia: 'estudiante', rol: 'miembro',       fecha_registro: '2024-03-10' }),
    Miembro.create({ cedula: '45678901', password: '45678901', nombre: 'Ana Rodríguez',    email: 'ana@example.com',    telefono: '+56 9 7777 8888', direccion: 'Blvd. Norte 321, Ñuñoa',           tipo_membresia: 'basica',     rol: 'miembro',       fecha_registro: '2023-11-05' }),
    Miembro.create({ cedula: '56789012', password: '56789012', nombre: 'Luis Martínez',    email: 'luis@example.com',   telefono: '+56 9 3333 4444', direccion: 'Villa del Sol 654, Maipú',          tipo_membresia: 'premium',    rol: 'miembro',       fecha_registro: '2021-06-30' }),
    Miembro.create({ cedula: '00000001', password: 'admin',    nombre: 'Carmen Silva',     email: 'bibliotecario@libraryhub.cl', telefono: '+56 2 2345 6789',                                       tipo_membresia: null,         rol: 'bibliotecario', fecha_registro: '2021-01-01' }),
  ])
  const [juan, maria, carlos, ana, luis] = miembros

  // ── Libros ───────────────────────────────────────────────
  console.log('📚 Insertando libros...')
  const libros = await Libro.insertMany([
    { titulo: 'Cien años de soledad',           isbn: '9788439711063', autores: ['Gabriel García Márquez'], editorial: 'Sudamericana', categoria: cat('Ficción'),   año_publicacion: 1967, paginas: 417, cantidad_copias: 5, copias_disponibles: 3 },
    { titulo: 'Harry Potter y la piedra filosofal', isbn: '9788439136064', autores: ['J.K. Rowling'],           editorial: 'Bloomsbury',   categoria: cat('Ficción'),   año_publicacion: 1997, paginas: 309, cantidad_copias: 8, copias_disponibles: 0 },
    { titulo: 'Una breve historia del tiempo',   isbn: '9780553380163', autores: ['Stephen Hawking'],         editorial: 'Bantam',       categoria: cat('Ciencia'),   año_publicacion: 1988, paginas: 198, cantidad_copias: 3, copias_disponibles: 2 },
    { titulo: 'El Alquimista',                   isbn: '9788408034703', autores: ['Paulo Coelho'],            editorial: 'Sudamericana', categoria: cat('Filosofía'), año_publicacion: 1988, paginas: 224, cantidad_copias: 6, copias_disponibles: 6 },
    { titulo: 'Un mundo feliz',                  isbn: '9788408034895', autores: ['Aldous Huxley'],           editorial: 'Bantam',       categoria: cat('Ficción'),   año_publicacion: 1932, paginas: 291, cantidad_copias: 4, copias_disponibles: 3 },
    { titulo: 'Sapiens: De animales a dioses',   isbn: '9788408163787', autores: ['Yuval Noah Harari'],       editorial: 'Debate',       categoria: cat('Historia'),  año_publicacion: 2011, paginas: 496, cantidad_copias: 4, copias_disponibles: 1 },
    { titulo: 'El nombre de la rosa',             isbn: '9788467037807', autores: ['Umberto Eco'],             editorial: 'Debolsillo',   categoria: cat('Ficción'),   año_publicacion: 1980, paginas: 544, cantidad_copias: 2, copias_disponibles: 2 },
    { titulo: 'Clean Code',                       isbn: '9780132350884', autores: ['Robert C. Martin'],        editorial: 'Prentice Hall', categoria: cat('Técnica'),  año_publicacion: 2008, paginas: 431, cantidad_copias: 3, copias_disponibles: 0 },
  ])
  const [cienAnios, harry, hawking, alquimista, mundoFeliz, sapiens, rosa, cleanCode] = libros

  // ── Préstamos ────────────────────────────────────────────
  console.log('📋 Insertando préstamos...')
  const hoy = new Date()
  const hace = dias => { const d = new Date(hoy); d.setDate(d.getDate() - dias); return d }
  const en   = dias => { const d = new Date(hoy); d.setDate(d.getDate() + dias); return d }

  const prestamos = await Prestamo.insertMany([
    { miembro: juan.id,   libro: cienAnios.id,  fecha_prestamo: hace(18), fecha_devolucion_esperada: hace(4),  estado: 'vencido' },   // vencido hace 4 días
    { miembro: maria.id,  libro: harry.id,       fecha_prestamo: hace(11), fecha_devolucion_esperada: en(3),    estado: 'activo'  },   // vence en 3 días (alerta)
    { miembro: carlos.id, libro: hawking.id,     fecha_prestamo: hace(7),  fecha_devolucion_esperada: en(7),    estado: 'activo'  },   // activo normal
    { miembro: luis.id,   libro: mundoFeliz.id,  fecha_prestamo: hace(5),  fecha_devolucion_esperada: en(9),    estado: 'activo'  },   // activo normal
    { miembro: juan.id,   libro: sapiens.id,     fecha_prestamo: hace(4),  fecha_devolucion_esperada: en(2),    estado: 'activo'  },   // vence en 2 días (alerta)
    { miembro: maria.id,  libro: cleanCode.id,   fecha_prestamo: hace(1),  fecha_devolucion_esperada: en(13),   estado: 'activo'  },   // activo normal
  ])
  const [prestJuan, prestMaria] = prestamos

  // ── Reservas ─────────────────────────────────────────────
  console.log('🔖 Insertando reservas...')
  await Reserva.insertMany([
    { miembro: juan.id,   libro: harry.id,    posicion_cola: 1, estado: 'reservado', fecha_reserva: hace(9),  fecha_estimada_disponibilidad: en(5)  },
    { miembro: carlos.id, libro: cienAnios.id, posicion_cola: 2, estado: 'reservado', fecha_reserva: hace(4),  fecha_estimada_disponibilidad: en(12) },
    { miembro: luis.id,   libro: cleanCode.id, posicion_cola: 1, estado: 'reservado', fecha_reserva: hace(3),  fecha_estimada_disponibilidad: en(15) },
  ])

  // ── Multas ───────────────────────────────────────────────
  // Multa automática por préstamo vencido de Juan (4 días × $1.000)
  console.log('💸 Insertando multas...')
  await Multa.insertMany([
    { prestamo: prestJuan.id, miembro: juan.id, monto: 4000, pagada: false },
  ])

  console.log('\n✅ Seed completado exitosamente.')
  console.log('   Credenciales de acceso:')
  console.log('   Miembro básico   → cédula: 12345678 / pass: 12345678')
  console.log('   Miembro premium  → cédula: 23456789 / pass: 23456789')
  console.log('   Bibliotecario    → cédula: 00000001 / pass: admin')
  console.log('')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
