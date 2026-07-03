import { Schema, model } from 'mongoose'

const prestamoSchema = new Schema(
  {
    miembro:                   { type: Schema.Types.ObjectId, ref: 'Miembro', required: true },
    libro:                     { type: Schema.Types.ObjectId, ref: 'Libro',   required: true },
    fecha_prestamo:            { type: Date, default: Date.now },
    fecha_devolucion_esperada: { type: Date, required: true },
    fecha_devolucion:          { type: Date, default: null },
    estado:                    { type: String, enum: ['activo', 'devuelto', 'vencido'], default: 'activo' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

prestamoSchema.index({ miembro: 1, estado: 1 })
prestamoSchema.index({ estado: 1 })

export default model('Prestamo', prestamoSchema)
