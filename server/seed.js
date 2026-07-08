// Script de semilla (seed).
// Carga un conjunto de datos iniciales en MongoDB para poder probar
// la aplicación sin tener que cargar los datos a mano desde la UI.
//
// Como correrlo:   npm run seed
// Importante:     borra y recrea todas las colecciones cada vez que se ejecuta.

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

  // 1. Limpiamos todas las colecciones para empezar de cero.
  console.log('Limpiando colecciones...')
  await Promise.all([
    Categoria.deleteMany({}),
    Miembro.deleteMany({}),
    Libro.deleteMany({}),
    Prestamo.deleteMany({}),
    Reserva.deleteMany({}),
    Multa.deleteMany({}),
  ])

  // 2. Insertamos las categorias del sistema.
  console.log('Insertando categorias...')
  const cats = await Categoria.insertMany([
    { nombre: 'Ficcion',    descripcion: 'Novelas y relatos' },
    { nombre: 'Tecnica',    descripcion: 'Libros de computacion' },
    { nombre: 'Historia',   descripcion: 'Libros historicos' },
    { nombre: 'Ciencia',    descripcion: 'Libros cientificos' },
    { nombre: 'Filosofia',  descripcion: 'Filosofia y pensamiento' },
  ])
  // Funcion auxiliar para buscar el id de una categoria por su nombre.
  const cat = nombre => cats.find(c => c.nombre === nombre)._id

  // 3. Insertamos los miembros. El modelo hashea las contrasenas
  //    automaticamente antes de guardarlas, asi que aca las escribimos en claro.
  console.log('Insertando miembros...')
  const miembros = await Promise.all([
    Miembro.create({ cedula: '12345678', password: '12345678', nombre: 'Juan Perez',     email: 'juan@example.com',   telefono: '+56 9 1234 5678', direccion: 'Av. Principal 123, Santiago',       tipo_membresia: null,            rol: 'miembro',       fecha_registro: '2023-01-15' }),
    Miembro.create({ cedula: '23456789', password: '23456789', nombre: 'Maria Garcia',   email: 'maria@example.com',  telefono: '+56 9 9876 5432', direccion: 'Calle Los Alamos 456, Providencia', tipo_membresia: null,           rol: 'miembro',       fecha_registro: '2022-08-20' }),
    Miembro.create({ cedula: '34567890', password: '34567890', nombre: 'Carlos Lopez',   email: 'carlos@example.com', telefono: '+56 9 5555 1234', direccion: 'Pasaje Sur 789, Las Condes',        tipo_membresia: null,        rol: 'miembro',       fecha_registro: '2024-03-10' }),
    Miembro.create({ cedula: '45678901', password: '45678901', nombre: 'Ana Rodriguez',  email: 'ana@example.com',    telefono: '+56 9 7777 8888', direccion: 'Blvd. Norte 321, Nunoa',            tipo_membresia: null,            rol: 'miembro',       fecha_registro: '2023-11-05' }),
    Miembro.create({ cedula: '56789012', password: '56789012', nombre: 'Luis Martinez',  email: 'luis@example.com',   telefono: '+56 9 3333 4444', direccion: 'Villa del Sol 654, Maipu',          tipo_membresia: null,           rol: 'miembro',       fecha_registro: '2021-06-30' }),
    Miembro.create({ cedula: '00000001', password: 'admin',    nombre: 'Carmen Silva',   email: 'bibliotecario@libraryhub.cl', telefono: '+56 2 2345 6789',                       tipo_membresia: null,         rol: 'bibliotecario', fecha_registro: '2021-01-01' }),
  ])
  const [juan, maria, carlos,luis] = miembros

  // 4. Insertamos los libros del catalogo.
  console.log('Insertando libros...')
  const libros = await Libro.insertMany([
    { titulo: 'Cien años de soledad',                isbn: '9788439711063', autores: ['Gabriel Garcia Marquez'], editorial: 'Sudamericana',  categoria: cat('Ficcion'),   año_publicacion: 1967, paginas: 417, cantidad_copias: 5, copias_disponibles: 3 },
    { titulo: 'Harry Potter y la piedra filosofal',  isbn: '9788439136064', autores: ['J.K. Rowling'],           editorial: 'Bloomsbury',    categoria: cat('Ficcion'),   año_publicacion: 1997, paginas: 309, cantidad_copias: 8, copias_disponibles: 0 },
    { titulo: 'Una breve historia del tiempo',       isbn: '9780553380163', autores: ['Stephen Hawking'],        editorial: 'Bantam',        categoria: cat('Ciencia'),   año_publicacion: 1988, paginas: 198, cantidad_copias: 3, copias_disponibles: 2 },
    { titulo: 'El Alquimista',                       isbn: '9788408034703', autores: ['Paulo Coelho'],           editorial: 'Sudamericana',  categoria: cat('Filosofia'), año_publicacion: 1988, paginas: 224, cantidad_copias: 6, copias_disponibles: 6 },
    { titulo: 'Un mundo feliz',                      isbn: '9788408034895', autores: ['Aldous Huxley'],          editorial: 'Bantam',        categoria: cat('Ficcion'),   año_publicacion: 1932, paginas: 291, cantidad_copias: 4, copias_disponibles: 3 },
    { titulo: 'Sapiens: De animales a dioses',       isbn: '9788408163787', autores: ['Yuval Noah Harari'],      editorial: 'Debate',        categoria: cat('Historia'),  año_publicacion: 2011, paginas: 496, cantidad_copias: 4, copias_disponibles: 1 },
    { titulo: 'El nombre de la rosa',                isbn: '9788467037807', autores: ['Umberto Eco'],            editorial: 'Debolsillo',    categoria: cat('Ficcion'),   año_publicacion: 1980, paginas: 544, cantidad_copias: 2, copias_disponibles: 2 },
    { titulo: 'Clean Code',                          isbn: '9780132350884', autores: ['Robert C. Martin'],       editorial: 'Prentice Hall', categoria: cat('Tecnica'),   año_publicacion: 2008, paginas: 431, cantidad_copias: 3, copias_disponibles: 0 },
  ])
  const [cienAños, harry, hawking,mundoFeliz, sapiens,cleanCode] = libros

  // 5. Insertamos prestamos de ejemplo. Las fechas se calculan en base a hoy
  //    para que siempre se vean distintos escenarios (vencido, alerta, normal).
  console.log('Insertando prestamos...')
  const hoy = new Date()
  // Helpers para sumar o restar dias a la fecha actual.
  const hace = dias => { const d = new Date(hoy); d.setDate(d.getDate() - dias); return d }
  const en   = dias => { const d = new Date(hoy); d.setDate(d.getDate() + dias); return d }

  const prestamos = await Prestamo.insertMany([
    { miembro: juan.id,   libro: cienAños.id,  fecha_prestamo: hace(18), fecha_devolucion_esperada: hace(4),  estado: 'vencido' },
    { miembro: maria.id,  libro: harry.id,       fecha_prestamo: hace(11), fecha_devolucion_esperada: en(3),    estado: 'activo'  },
    { miembro: carlos.id, libro: hawking.id,     fecha_prestamo: hace(7),  fecha_devolucion_esperada: en(7),    estado: 'activo'  },
    { miembro: luis.id,   libro: mundoFeliz.id,  fecha_prestamo: hace(5),  fecha_devolucion_esperada: en(9),    estado: 'activo'  },
    { miembro: juan.id,   libro: sapiens.id,     fecha_prestamo: hace(4),  fecha_devolucion_esperada: en(2),    estado: 'activo'  },
    { miembro: maria.id,  libro: cleanCode.id,   fecha_prestamo: hace(1),  fecha_devolucion_esperada: en(13),   estado: 'activo'  },
  ])
  const [prestJuan] = prestamos

  // 6. Insertamos reservas de ejemplo, una por cada libro agotado.
  console.log('Insertando reservas...')
  await Reserva.insertMany([
    { miembro: juan.id,   libro: harry.id,     posicion_cola: 1, estado: 'reservado', fecha_reserva: hace(9),  fecha_estimada_disponibilidad: en(5)  },
    { miembro: carlos.id, libro: cienAños.id, posicion_cola: 2, estado: 'reservado', fecha_reserva: hace(4),  fecha_estimada_disponibilidad: en(12) },
    { miembro: luis.id,   libro: cleanCode.id, posicion_cola: 1, estado: 'reservado', fecha_reserva: hace(3),  fecha_estimada_disponibilidad: en(15) },
  ])

  // 7. Insertamos una multa ya existente para probar la vista correspondiente.
  //    Representa 4 dias de atraso a $1.000 CLP por dia.
  console.log('Insertando multas...')
  await Multa.insertMany([
    { prestamo: prestJuan.id, miembro: juan.id, monto: 4000, pagada: false },
  ])

  console.log('\nSeed completado exitosamente.')
  console.log('Credenciales de acceso:')
  console.log('  Miembro          -> cedula: 12345678 / pass: 12345678')
  console.log('  Bibliotecario    -> cedula: 00000001 / pass: admin')
  console.log('')

  await mongoose.disconnect()
  process.exit(0)
}

try {
  await seed()
} catch (err) {
  console.error('Error en seed:', err)
  process.exit(1)
}
