const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const mongoose = require('mongoose')

let ventana

async function conectarMongo() {
  try {
    await mongoose.connect('mongodb://localhost:27017/libraryhub')
    console.log('MongoDB conectado')
  } catch (error) {
    console.error('Error al conectar MongoDB:', error.message)
  }
}

const libroSchema = new mongoose.Schema({
  titulo: String,
  autores: [String],
  isbn: String,
  cantidad_copias: Number,
  categoria_id: mongoose.Schema.Types.ObjectId,
})

const LibroMongo = mongoose.model('Libro', libroSchema, 'libros')

ipcMain.handle('mongo-listar-libros', async () => {
  const libros = await LibroMongo.find().lean()

  return libros.map((libro) => ({
    id: String(libro._id),
    titulo: libro.titulo,
    autores: libro.autores || [],
    isbn: libro.isbn,
    cantidad_copias: libro.cantidad_copias,
    categoria_id: libro.categoria_id ? String(libro.categoria_id) : null,
  }))
})

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../src/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  ventana.loadURL(url)
}

app.on('ready', async () => {
  await conectarMongo()
  crearVentana()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})