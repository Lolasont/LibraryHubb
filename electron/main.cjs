// Proceso principal de Electron.
// Crea la ventana y registra los canales IPC que el renderer (React)
// puede invocar via window.libraryHub (expuesto en preload.cjs).
//
// Los handlers de cada canal delegan en los services de server/services/.
// Cualquier excepcion lanzada por un service (incluidos los cortes de
// sesion/rol) se convierte en { ok: false, mensaje } en lugar de tirar
// la app.

const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')

const isDev = !app.isPackaged

app.commandLine.appendSwitch('disable-features', 'WindowRestore')

// ── Carga dinamica de los services (son ES Modules) ─────────────
// main.cjs es CommonJS, pero los services viven en server/services/ y son
// ES Modules (porque server/package.json declara "type": "module" y la
// raiz tambien). Por eso usamos import() dinamico, que es la unica forma
// valida de traer codigo ESM desde un archivo CJS.
async function loadServices() {
  const [
    authService,
    categoriasService,
    librosService,
    prestamosService,
    reservasService,
    multasService,
    miembrosService,
    sesionService,
  ] = await Promise.all([
    import('../server/services/auth.service.js'),
    import('../server/services/categorias.service.js'),
    import('../server/services/libros.service.js'),
    import('../server/services/prestamos.service.js'),
    import('../server/services/reservas.service.js'),
    import('../server/services/multas.service.js'),
    import('../server/services/miembros.service.js'),
    import('../server/services/sesion.service.js'),
  ])

  return { authService, categoriasService, librosService, prestamosService, reservasService, multasService, miembrosService, sesionService }
}

// Helper que envuelve un handler de IPC para que cualquier error
// (excepcion de Mongoose, corte de sesion, falta de rol, etc.) se
// convierta en una respuesta { ok: false, mensaje } y no tumbe la app.
function conManejorDeErrores(fn) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error('Error en canal IPC:', error)
      return { ok: false, mensaje: error?.message ?? 'Error inesperado.' }
    }
  }
}

// Registra los 17 canales IPC. Se llama una sola vez, despues de
// conectar a MongoDB, dentro de app.whenReady().
function registrarCanalesIPC({ authService, categoriasService, librosService, prestamosService, reservasService, multasService, miembrosService, sesionService }) {
  const { getUsuarioActual } = sesionService

  // auth
  ipcMain.handle('auth:login', conManejorDeErrores((_e, cedula, password) =>
    authService.login(cedula, password)))

  // categorias
  ipcMain.handle('categorias:listar', conManejorDeErrores(() =>
    categoriasService.listarCategorias()))

  // libros
  ipcMain.handle('libros:buscar', conManejorDeErrores((_e, filtros) =>
    librosService.buscarLibros(filtros)))
  ipcMain.handle('libros:detalle', conManejorDeErrores((_e, id) =>
    librosService.getLibroById(id)))

  // prestamos
  ipcMain.handle('prestamos:misActivos', conManejorDeErrores(() =>
    prestamosService.getPrestamosActivos(getUsuarioActual())))
  ipcMain.handle('prestamos:listarTodos', conManejorDeErrores(() =>
    prestamosService.getTodosPrestamos(getUsuarioActual())))
  ipcMain.handle('prestamos:solicitar', conManejorDeErrores((_e, libroId) =>
    prestamosService.solicitarPrestamo(libroId, getUsuarioActual())))
  ipcMain.handle('prestamos:renovar', conManejorDeErrores((_e, prestamoId) =>
    prestamosService.renovarPrestamo(prestamoId, getUsuarioActual())))
  ipcMain.handle('prestamos:devolver', conManejorDeErrores((_e, prestamoId) =>
    prestamosService.registrarDevolucion(prestamoId, getUsuarioActual())))

  // reservas
  ipcMain.handle('reservas:misReservas', conManejorDeErrores(() =>
    reservasService.getReservasByMiembro(getUsuarioActual())))
  ipcMain.handle('reservas:porLibro', conManejorDeErrores((_e, libroId) =>
    reservasService.getReservasByLibro(libroId, getUsuarioActual())))
  ipcMain.handle('reservas:listarTodas', conManejorDeErrores(() =>
    reservasService.getTodasReservas(getUsuarioActual())))
  ipcMain.handle('reservas:crear', conManejorDeErrores((_e, libroId) =>
    reservasService.hacerReserva(libroId, getUsuarioActual())))
  ipcMain.handle('reservas:cancelar', conManejorDeErrores((_e, reservaId) =>
    reservasService.cancelarReserva(reservaId, getUsuarioActual())))

  // multas
  ipcMain.handle('multas:misMultas', conManejorDeErrores(() =>
    multasService.getMultasByMiembro(getUsuarioActual())))
  ipcMain.handle('multas:listarTodas', conManejorDeErrores(() =>
    multasService.getTodasMultas(getUsuarioActual())))

  // miembros
  ipcMain.handle('miembros:listar', conManejorDeErrores(() =>
    miembrosService.listarMiembros(getUsuarioActual())))
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: 'LibraryHub',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  try {
    // Conectamos a MongoDB. La URI viene de server/.env (MONGODB_URI).
    // server/config/db.js carga dotenv/config internamente? No, en realidad
    // no lo carga. Lo hacemos aca para que el proceso principal tenga la
    // variable visible antes de conectar.
    require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') })
    const { conectarDB } = await import('../server/config/db.js')
    await conectarDB()

    // Cargamos los services y registramos los canales IPC.
    const services = await loadServices()
    registrarCanalesIPC(services)
  } catch (error) {
    console.error('Error al iniciar la aplicacion:', error)
    app.quit()
    return
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
