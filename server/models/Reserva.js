import { Schema, model } from 'mongoose'

const reservaSchema = new Schema(
  {
    miembro:                       { type: Schema.Types.ObjectId, ref: 'Miembro', required: true },
    libro:                         { type: Schema.Types.ObjectId, ref: 'Libro',   required: true },
    fecha_reserva:                 { type: Date, default: Date.now },
    posicion_cola:                 { type: Number, required: true, min: 1 },
    estado:                        { type: String, enum: ['reservado', 'disponible', 'cancelado'], default: 'reservado' },
    fecha_estimada_disponibilidad: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

reservaSchema.index({ miembro: 1, estado: 1 })
reservaSchema.index({ libro: 1, estado: 1 })

export default model('Reserva', reservaSchema)
