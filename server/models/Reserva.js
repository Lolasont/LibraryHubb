// Modelo de Mongoose para las reservas.
// Una reserva es un "anotate" que hace un socio en un libro sin copias
// disponibles. Las reservas tienen una posicion en la cola.

import { Schema, model } from 'mongoose'

const reservaSchema = new Schema(
  {
    miembro:                       { type: Schema.Types.ObjectId, ref: 'Miembro', required: true },
    libro:                         { type: Schema.Types.ObjectId, ref: 'Libro',   required: true },
    fecha_reserva:                 { type: Date, default: Date.now },
    // Posicion del socio en la cola de espera de ese libro. Empieza en 1.
    posicion_cola:                 { type: Number, required: true, min: 1 },
    estado:                        { type: String, enum: ['reservado', 'disponible', 'cancelado'], default: 'reservado' },
    // Estimacion de cuando el libro estara disponible para el socio.
    fecha_estimada_disponibilidad: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

reservaSchema.index({ miembro: 1, estado: 1 })
reservaSchema.index({ libro: 1, estado: 1 })

export default model('Reserva', reservaSchema)
