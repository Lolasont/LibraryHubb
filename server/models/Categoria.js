import { Schema, model } from 'mongoose'

const categoriaSchema = new Schema(
  {
    nombre:      { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export default model('Categoria', categoriaSchema)
