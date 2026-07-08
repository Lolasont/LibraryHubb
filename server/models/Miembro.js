// Modelo de Mongoose para los miembros de la biblioteca.
// Puede ser un socio (rol "miembro") o un bibliotecario (rol "bibliotecario").
// Las contrasenas se guardan hasheadas, nunca en texto plano.

import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'

const miembroSchema = new Schema(
  {
    // Cedula de identidad. Es el identificador con el que el usuario inicia sesion.
    cedula:         { type: String, required: true, unique: true, trim: true },
    // Contrasena. Se guarda hasheada gracias al hook pre('save') de abajo.
    password:       { type: String, required: true },
    nombre:         { type: String, required: true, trim: true },
    email:          { type: String, trim: true, lowercase: true, default: null },
    direccion:      { type: String, default: null },
    telefono:       { type: String, default: null },
    // Tipo de plan del socio. El bibliotecario no tiene plan (null).
    // El sistema de membresias (basica/premium/estudiante) fue eliminado por
    // decision del equipo: no formaba parte del enunciado original y solo
    // agregaba complejidad. El campo se conserva como null para no romper
    // las respuestas de la API que aun lo incluyen.
    tipo_membresia: { type: String, default: null },
    // Estado de la cuenta. Si esta "suspendido" o "cancelado" no puede entrar.
    estado:         { type: String, enum: ['activo', 'suspendido', 'cancelado'],  default: 'activo' },
    // Determina si el usuario ve el panel de socio o el panel de bibliotecario.
    rol:            { type: String, enum: ['miembro', 'bibliotecario'],            default: 'miembro' },
    fecha_registro: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Hook que se ejecuta justo antes de guardar el documento.
// Si la contrasena fue modificada, la hasheamos con bcrypt (10 rondas).
miembroSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Metodo de instancia para comparar una contrasena en texto plano
// contra el hash guardado. Devuelve true si coincide.
miembroSchema.methods.verificarPassword = function (password) {
  return bcrypt.compare(password, this.password)
}

// Cuando el modelo se serializa a JSON (por ejemplo al enviar una respuesta),
// eliminamos el campo password para que nunca viaje al frontend.
miembroSchema.set('toJSON', {
  virtuals: true,
  transform: (_, obj) => {
    delete obj.password
    return obj
  },
})

export default model('Miembro', miembroSchema)
