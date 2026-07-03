import { Schema, model } from 'mongoose'

const libroSchema = new Schema(
  {
    titulo:             { type: String, required: true, trim: true },
    isbn:               { type: String, unique: true, sparse: true, trim: true },
    // Autores y editorial embebidos como strings (no requieren colección propia)
    autores:            [{ type: String, trim: true }],
    editorial:          { type: String, trim: true, default: null },
    categoria:          { type: Schema.Types.ObjectId, ref: 'Categoria', default: null },
    año_publicacion:    { type: Number, default: null },
    paginas:            { type: Number, default: null },
    cantidad_copias:    { type: Number, default: 1, min: 0 },
    copias_disponibles: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Índices para búsqueda eficiente
libroSchema.index({ titulo: 'text', autores: 'text' })
libroSchema.index({ isbn: 1 })
libroSchema.index({ categoria: 1 })

export default model('Libro', libroSchema)
