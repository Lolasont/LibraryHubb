const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('db', {
    probarconexion: () => 'Puente Electron funcionando'
})