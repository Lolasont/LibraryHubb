// Modelo de Mongoose para las multas.
// Se generan automaticamente cuando un socio devuelve un libro tarde.
// El monto se cobra en pesos chilenos (CLP).

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
