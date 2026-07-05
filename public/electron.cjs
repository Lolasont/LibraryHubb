const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const { contextIsolated } = require('process')

let ventana

function crearVentana() {
    ventana = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../src/preload.js'),
            contextIsolated: true,
            nodeIntegration: false,
        },
    })

    const url = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`

        ventana.loadURL(url)
}

app.on('ready', crearVentana)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})