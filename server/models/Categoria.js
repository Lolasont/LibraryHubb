// Modelo de Mongoose para las categorias de libros.
// Es muy simple: solo nombre y descripcion.
// Los nombres son unicos para no tener categorias duplicadas.

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

const categoriaSchema = new Schema(
  {
    nombre:      { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export default model('Categoria', categoriaSchema)
