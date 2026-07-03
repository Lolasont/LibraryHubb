import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'

const miembroSchema = new Schema(
  {
    cedula:          { type: String, required: true, unique: true, trim: true },
    password:        { type: String, required: true },
    nombre:          { type: String, required: true, trim: true },
    email:           { type: String, trim: true, lowercase: true, default: null },
    direccion:       { type: String, default: null },
    telefono:        { type: String, default: null },
    tipo_membresia:  { type: String, enum: ['basica', 'premium', 'estudiante', null], default: null },
    estado:          { type: String, enum: ['activo', 'suspendido', 'cancelado'],  default: 'activo' },
    rol:             { type: String, enum: ['miembro', 'bibliotecario'],            default: 'miembro' },
    fecha_registro:  { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Hash automático antes de guardar
miembroSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Método para comparar contraseña
miembroSchema.methods.verificarPassword = function (password) {
  return bcrypt.compare(password, this.password)
}

// No exponer el password en respuestas JSON
miembroSchema.set('toJSON', {
  virtuals: true,
  transform: (_, obj) => {
    delete obj.password
    return obj
  },
})

export default model('Miembro', miembroSchema)
