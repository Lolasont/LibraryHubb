const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('db', {
  probarConexion: () => 'Puente Electron funcionando',

  listarLibrosMongo: () => ipcRenderer.invoke('mongo-listar-libros'),
})