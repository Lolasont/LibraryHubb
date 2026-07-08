// Modelo de Mongoose para los prestamos.
// Un prestamo representa un libro que un socio se llevo y que tiene
// que devolver antes de la fecha_devolucion_esperada.

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

const prestamoSchema = new Schema(
  {
    // Referencias a las otras colecciones. Mongoose se encarga de las joins via populate.
    miembro:                   { type: Schema.Types.ObjectId, ref: 'Miembro', required: true },
    libro:                     { type: Schema.Types.ObjectId, ref: 'Libro',   required: true },
    fecha_prestamo:            { type: Date, default: Date.now },
    // Fecha limite para devolver el libro. Por defecto son 14 dias.
    fecha_devolucion_esperada: { type: Date, required: true },
    // Fecha real en la que se devolvio. Mientras esta en null, el prestamo sigue activo.
    fecha_devolucion:          { type: Date, default: null },
    // Estado del prestamo. "vencido" lo calcula el frontend al comparar fechas.
    estado:                    { type: String, enum: ['activo', 'devuelto', 'vencido'], default: 'activo' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Indices para acelerar las consultas mas comunes.
prestamoSchema.index({ miembro: 1, estado: 1 })
prestamoSchema.index({ estado: 1 })

export default model('Prestamo', prestamoSchema)
