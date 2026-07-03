import { Schema, model } from 'mongoose'

const multaSchema = new Schema(
  {
    prestamo:   { type: Schema.Types.ObjectId, ref: 'Prestamo', required: true },
    miembro:    { type: Schema.Types.ObjectId, ref: 'Miembro',  required: true },
    monto:      { type: Number, required: true, min: 0 },  // en CLP
    pagada:     { type: Boolean, default: false },
    fecha_pago: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

multaSchema.index({ miembro: 1, pagada: 1 })

export default model('Multa', multaSchema)
