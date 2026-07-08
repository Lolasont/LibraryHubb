// Modelo de Mongoose para los libros del catalogo.
// Guarda metadata del libro y el control de copias disponibles.

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

import { Schema, model } from 'mongoose'

const libroSchema = new Schema(
  {
    titulo:          { type: String, required: true, trim: true },
    isbn:            { type: String, unique: true, sparse: true, trim: true },
    // Los autores se guardan como array de strings porque no necesitamos
    // una coleccion aparte de autores para esta primera version.
    autores:         [{ type: String, trim: true }],
    editorial:       { type: String, trim: true, default: null },
    // Referencia a la categoria. Esto permite filtrar y mostrar su nombre.
    categoria:       { type: Schema.Types.ObjectId, ref: 'Categoria', default: null },
    año_publicacion: { type: Number, default: null },
    paginas:         { type: Number, default: null },
    // Total de copias que tiene la biblioteca del libro.
    cantidad_copias: { type: Number, default: 1, min: 0 },
    // Copias que aun no se prestaron. Se actualiza con $inc al prestar/devolver.
    copias_disponibles: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Indices para que las busquedas y los filtros sean rapidos.
libroSchema.index({ titulo: 'text', autores: 'text' })
libroSchema.index({ isbn: 1 })
libroSchema.index({ categoria: 1 })

export default model('Libro', libroSchema)
