// El preload es un puente seguro entre Electron y el frontend React.
// Se ejecuta en un contexto aislado y solo expone al frontend
// las funciones que elijamos de manera controlada.
//
// Asi, el frontend puede acceder a capacidades del sistema operativo
// (por ejemplo, leer archivos locales o hablar con la base de datos)
// sin comprometer la seguridad de la aplicacion.

const { contextBridge } = require('electron')

// Exponemos un objeto `db` en la variable global `window`.
// Por ahora es solo un puente de prueba. Aqui se pueden sumar luego
// funciones reales para conectar con la base de datos local, manejar
// archivos, etc.
contextBridge.exposeInMainWorld('db', {
  probarconexion: () => 'Puente Electron funcionando',
})
