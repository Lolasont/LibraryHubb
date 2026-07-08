// Modelo de Mongoose para las categorias de libros.
// Es muy simple: solo nombre y descripcion.
// Los nombres son unicos para no tener categorias duplicadas.

import { Schema, model } from 'mongoose'

const categoriaSchema = new Schema(
  {
    nombre:      { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export default model('Categoria', categoriaSchema)
