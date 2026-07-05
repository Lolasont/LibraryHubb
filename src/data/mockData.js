// Datos de ejemplo para usar el frontend sin backend.
// Mantienen el mismo orden logico que las colecciones de MongoDB:
// categorias -> libros -> usuarios -> prestamos -> reservas -> multas.

export const categorias = [
  { id: 1, nombre: 'Ficcion',    descripcion: 'Novelas y relatos' },
  { id: 2, nombre: 'Tecnica',    descripcion: 'Libros de computacion' },
  { id: 3, nombre: 'Historia',   descripcion: 'Libros historicos' },
  { id: 4, nombre: 'Ciencia',    descripcion: 'Libros cientificos' },
  { id: 5, nombre: 'Filosofia',  descripcion: 'Filosofia y pensamiento' },
]

export const libros = [
  {
    id: 1,
    titulo: 'Cien anos de soledad',
    isbn: '9788439711063',
    autores: ['Gabriel Garcia Marquez'],
    editorial: 'Sudamericana',
    categoria: 'Ficcion',
    categoria_id: 1,
    año_publicacion: 1967,
    paginas: 417,
    cantidad_copias: 5,
    copias_disponibles: 3,
  },
  {
    id: 2,
    titulo: 'Harry Potter y la piedra filosofal',
    isbn: '9788439136064',
    autores: ['J.K. Rowling'],
    editorial: 'Bloomsbury',
    categoria: 'Ficcion',
    categoria_id: 1,
    año_publicacion: 1997,
    paginas: 309,
    cantidad_copias: 8,
    copias_disponibles: 0,
  },
  {
    id: 3,
    titulo: 'Una breve historia del tiempo',
    isbn: '9780553380163',
    autores: ['Stephen Hawking'],
    editorial: 'Bantam',
    categoria: 'Ciencia',
    categoria_id: 4,
    año_publicacion: 1988,
    paginas: 198,
    cantidad_copias: 3,
    copias_disponibles: 2,
  },
  {
    id: 4,
    titulo: 'El Alquimista',
    isbn: '9788408034703',
    autores: ['Paulo Coelho'],
    editorial: 'Sudamericana',
    categoria: 'Filosofia',
    categoria_id: 5,
    año_publicacion: 1988,
    paginas: 224,
    cantidad_copias: 6,
    copias_disponibles: 6,
  },
  {
    id: 5,
    titulo: 'Un mundo feliz',
    isbn: '9788408034895',
    autores: ['Aldous Huxley'],
    editorial: 'Bantam',
    categoria: 'Ficcion',
    categoria_id: 1,
    año_publicacion: 1932,
    paginas: 291,
    cantidad_copias: 4,
    copias_disponibles: 3,
  },
  {
    id: 6,
    titulo: 'Sapiens: De animales a dioses',
    isbn: '9788408163787',
    autores: ['Yuval Noah Harari'],
    editorial: 'Debate',
    categoria: 'Historia',
    categoria_id: 3,
    año_publicacion: 2011,
    paginas: 496,
    cantidad_copias: 4,
    copias_disponibles: 1,
  },
  {
    id: 7,
    titulo: 'El nombre de la rosa',
    isbn: '9788467037807',
    autores: ['Umberto Eco'],
    editorial: 'Debolsillo',
    categoria: 'Ficcion',
    categoria_id: 1,
    año_publicacion: 1980,
    paginas: 544,
    cantidad_copias: 2,
    copias_disponibles: 2,
  },
  {
    id: 8,
    titulo: 'Clean Code',
    isbn: '9780132350884',
    autores: ['Robert C. Martin'],
    editorial: 'Prentice Hall',
    categoria: 'Tecnica',
    categoria_id: 2,
    año_publicacion: 2008,
    paginas: 431,
    cantidad_copias: 3,
    copias_disponibles: 0,
  },
]

// Usuarios del sistema. La contrasena en claro es solo para el modo mock.
// En el backend se hashean con bcrypt antes de guardarse.
export const usuarios = [
  {
    id: 1, cedula: '12345678', password: '12345678',
    nombre: 'Juan Perez',     email: 'juan@example.com',
    direccion: 'Av. Principal 123, Santiago',    telefono: '+56 9 1234 5678',
    tipo_membresia: 'basica',     estado: 'activo', rol: 'miembro',
    fecha_registro: '2023-01-15',
  },
  {
    id: 2, cedula: '23456789', password: '23456789',
    nombre: 'Maria Garcia',   email: 'maria@example.com',
    direccion: 'Calle Los Alamos 456, Providencia', telefono: '+56 9 9876 5432',
    tipo_membresia: 'premium',    estado: 'activo', rol: 'miembro',
    fecha_registro: '2022-08-20',
  },
  {
    id: 3, cedula: '34567890', password: '34567890',
    nombre: 'Carlos Lopez',   email: 'carlos@example.com',
    direccion: 'Pasaje Sur 789, Las Condes',     telefono: '+56 9 5555 1234',
    tipo_membresia: 'estudiante', estado: 'activo', rol: 'miembro',
    fecha_registro: '2024-03-10',
  },
  {
    id: 4, cedula: '45678901', password: '45678901',
    nombre: 'Ana Rodriguez',  email: 'ana@example.com',
    direccion: 'Blvd. Norte 321, Nunoa',         telefono: '+56 9 7777 8888',
    tipo_membresia: 'basica',     estado: 'activo', rol: 'miembro',
    fecha_registro: '2023-11-05',
  },
  {
    id: 5, cedula: '56789012', password: '56789012',
    nombre: 'Luis Martinez',  email: 'luis@example.com',
    direccion: 'Villa del Sol 654, Maipu',       telefono: '+56 9 3333 4444',
    tipo_membresia: 'premium',    estado: 'activo', rol: 'miembro',
    fecha_registro: '2021-06-30',
  },
  {
    id: 6, cedula: '00000001', password: 'admin',
    nombre: 'Carmen Silva',   email: 'bibliotecario@libraryhub.cl',
    direccion: null, telefono: '+56 2 2345 6789',
    tipo_membresia: null,         estado: 'activo', rol: 'bibliotecario',
    fecha_registro: '2021-01-01',
  },
]

// Prestamos: las fechas se calcularon como relativas a la fecha de creacion
// de la semilla, para que se vean distintos escenarios.
export const prestamos = [
  {
    id: 1, miembro_id: 1, libro_id: 1, libro_titulo: 'Cien anos de soledad',
    fecha_prestamo: '2026-06-11', fecha_devolucion_esperada: '2026-06-25',
    fecha_devolucion: null, estado: 'vencido',
  },
  {
    id: 2, miembro_id: 2, libro_id: 2, libro_titulo: 'Harry Potter y la piedra filosofal',
    fecha_prestamo: '2026-06-18', fecha_devolucion_esperada: '2026-07-02',
    fecha_devolucion: null, estado: 'activo',
  },
  {
    id: 3, miembro_id: 3, libro_id: 3, libro_titulo: 'Una breve historia del tiempo',
    fecha_prestamo: '2026-06-22', fecha_devolucion_esperada: '2026-07-15',
    fecha_devolucion: null, estado: 'activo',
  },
  {
    id: 4, miembro_id: 4, libro_id: 4, libro_titulo: 'El Alquimista',
    fecha_prestamo: '2026-06-01', fecha_devolucion_esperada: '2026-06-15',
    fecha_devolucion: '2026-06-14', estado: 'devuelto',
  },
  {
    id: 5, miembro_id: 5, libro_id: 5, libro_titulo: 'Un mundo feliz',
    fecha_prestamo: '2026-06-24', fecha_devolucion_esperada: '2026-07-20',
    fecha_devolucion: null, estado: 'activo',
  },
  {
    id: 6, miembro_id: 1, libro_id: 6, libro_titulo: 'Sapiens: De animales a dioses',
    fecha_prestamo: '2026-06-25', fecha_devolucion_esperada: '2026-07-01',
    fecha_devolucion: null, estado: 'activo',
  },
  {
    id: 7, miembro_id: 2, libro_id: 8, libro_titulo: 'Clean Code',
    fecha_prestamo: '2026-06-28', fecha_devolucion_esperada: '2026-07-12',
    fecha_devolucion: null, estado: 'activo',
  },
]

export const reservas = [
  {
    id: 1, miembro_id: 1, libro_id: 2, libro_titulo: 'Harry Potter y la piedra filosofal',
    fecha_reserva: '2026-06-20', posicion_cola: 1, estado: 'reservado',
    fecha_estimada_disponibilidad: '2026-07-05',
  },
  {
    id: 2, miembro_id: 3, libro_id: 1, libro_titulo: 'Cien anos de soledad',
    fecha_reserva: '2026-06-25', posicion_cola: 2, estado: 'reservado',
    fecha_estimada_disponibilidad: '2026-07-12',
  },
  {
    id: 3, miembro_id: 5, libro_id: 8, libro_titulo: 'Clean Code',
    fecha_reserva: '2026-06-26', posicion_cola: 1, estado: 'reservado',
    fecha_estimada_disponibilidad: '2026-07-15',
  },
]

// Multas: monto en CLP.
export const multas = [
  {
    id: 1, prestamo_id: 1, miembro_id: 1, monto: 4000, pagada: false, fecha_pago: null,
  },
]
