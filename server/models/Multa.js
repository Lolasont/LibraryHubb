// Modelo de Mongoose para las multas.
// Se generan automaticamente cuando un socio devuelve un libro tarde.
// El monto se cobra en pesos chilenos (CLP).

import { Schema, model } from 'mongoose'

const multaSchema = new Schema(
  {
    // Cada multa queda asociada al prestamo que la origino.
    prestamo:   { type: Schema.Types.ObjectId, ref: 'Prestamo', required: true },
    miembro:    { type: Schema.Types.ObjectId, ref: 'Miembro',  required: true },
    monto:      { type: Number, required: true, min: 0 },   // Pesos chilenos
    pagada:     { type: Boolean, default: false },
    // Cuando se paga la multa se completa este campo. Mientras esta en null, sigue pendiente.
    fecha_pago: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

multaSchema.index({ miembro: 1, pagada: 1 })

export default model('Multa', multaSchema)
