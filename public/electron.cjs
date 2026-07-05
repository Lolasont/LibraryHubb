// Archivo principal del proceso de Electron.
// Electron es lo que envuelve la aplicacion web de React en una ventana
// de escritorio nativa (como cualquier programa instalado en el sistema).
//
// Flujo:
//  1. Cuando se ejecuta `npm run electron`, Electron levanta este archivo.
//  2. Este archivo abre una ventana de navegador interna (BrowserWindow).
//  3. Esa ventana carga la aplicacion React que Vite sirve en localhost:5173
//     durante el desarrollo, o el bundle estatico de /dist en produccion.

const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const isDev = require('electron-is-dev')

let ventana

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1200,
    height: 800,
    // Las webPreferences definen como se relaciona la ventana con Node.
    // contextIsolation y nodeIntegration en false son las opciones seguras
    // para que el frontend React no tenga acceso directo al sistema.
    webPreferences: {
      preload: path.join(__dirname, '../src/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // En desarrollo carga el servidor de Vite.
  // En produccion carga los archivos estaticos generados por `vite build`.
  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  ventana.loadURL(url)
}

// Cuando Electron este listo, creamos la ventana principal.
app.on('ready', crearVentana)

// Comportamiento estandar: cerrar la ventana cierra la app (excepto en macOS,
// donde las apps suelen quedar activas en el dock).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
