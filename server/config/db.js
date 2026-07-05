// Configuracion de la conexion a MongoDB.
// Se usa la libreria Mongoose, que facilita definir modelos y consultas.

import mongoose from 'mongoose'

export async function conectarDB() {
  try {
    // La cadena de conexion viene de la variable MONGODB_URI en el archivo .env.
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB conectado: ${conn.connection.host}`)
  } catch (error) {
    // Si la conexion falla, no tiene sentido seguir: cortamos el proceso.
    console.error('Error conectando a MongoDB:', error.message)
    process.exit(1)
  }
}
